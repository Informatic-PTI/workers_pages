import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "../src/index.js";
import { createOtpChallenge, getOtpChallenge } from "../src/db/otpChallenges.js";
import { createPasswordCredential } from "../src/db/credentials.js";
import { hashPassword } from "../src/lib/password.js";
import { enqueueOtpDelivery } from "../src/routes/auth.js";
import { handleQueue } from "../src/queues/index.js";

function challengeId() {
	return `otp_test_${crypto.randomUUID().replaceAll("-", "")}`;
}

async function seedChallenge(id) {
	await createOtpChallenge({ AUTH_DB: env.AUTH_DB }, {
		id,
		phone: "6285795717974",
		purpose: "login",
		otp_hash: "test_hash",
		max_attempts: 5,
		expires_at: new Date(Date.now() + 300_000).toISOString(),
	});
}

function testEnv(overrides = {}) {
	return {
		AUTH_DB: env.AUTH_DB,
		AUTH_SERVICE_KEY: "irwanmotor-auth-test",
		AUDIT_QUEUE: null,
		ENABLE_DIRECT_OTP_FALLBACK: "true",
		GOWA_API_BASE: "https://gowa.test",
		GOWA_API_TOKEN: "test-token",
		GOWA_DEVICE_ID: "punyatop1",
		PASSWORD_PEPPER: "test-password-pepper",
		PASSWORD_PBKDF2_ITERATIONS: "10000",
		OTP_PEPPER: "test-otp-pepper",
		...overrides,
	};
}

describe("OTP delivery contract", () => {
	beforeEach(() => vi.restoreAllMocks());

	it("returns queued only after the producer send resolves", async () => {
		const id = challengeId();
		await seedChallenge(id);
		let accepted = false;
		const send = vi.fn(async () => { accepted = true; });
		const result = await enqueueOtpDelivery(testEnv({ OTP_QUEUE: { send } }), {
			type: "otp_delivery",
			phone: "6285795717974",
			otp: "123456",
			purpose: "login",
			challenge_id: id,
			request_id: "req_test_queue",
		});

		expect(accepted).toBe(true);
		expect(send).toHaveBeenCalledOnce();
		expect(result).toEqual({ delivery_status: "queued", delivery_mode: "queue" });
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, id)).delivery_status).toBe("queued");
	});

	it("password login creates a challenge and queues the same challenge id", async () => {
		const suffix = crypto.randomUUID().slice(0, 8);
		const userId = `OTPUSER_${suffix}`;
		const username = `otpuser_${suffix}`;
		const password = "TestPassword!123";
		const runtime = testEnv();
		await env.AUTH_DB.prepare(
			"INSERT INTO users (id,username,phone,status) VALUES (?, ?, ?, 'active')",
		).bind(userId, username, `62857${Math.floor(10_000_000 + Math.random() * 89_999_999)}`).run();
		await createPasswordCredential(runtime, userId, await hashPassword(runtime, password, 10000));
		await env.AUTH_DB.prepare(
			"INSERT INTO user_auth_settings (user_id,skip_otp) VALUES (?, 0)",
		).bind(userId).run();
		const send = vi.fn(async () => {});
		const response = await worker.fetch(new Request("https://irwanmotor.test/auth/login/password", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ identifier: username, password }),
		}), testEnv({ OTP_QUEUE: { send } }), { waitUntil() {} });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.otp_required).toBe(true);
		expect(data.delivery_status).toBe("queued");
		expect(data.challenge_id).toMatch(/^otp_/);
		expect(send).toHaveBeenCalledOnce();
		expect(send.mock.calls[0][0].challenge_id).toBe(data.challenge_id);
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, data.challenge_id)).user_id).toBe(userId);
	});

	it("falls back to direct GOWA delivery when queue submission fails", async () => {
		const id = challengeId();
		await seedChallenge(id);
		const gowaFetch = vi.fn(async () => new Response(JSON.stringify({ code: "SUCCESS" }), { status: 200 }));
		const result = await enqueueOtpDelivery(testEnv({
			OTP_QUEUE: { send: vi.fn(async () => { throw new Error("queue_unavailable"); }) },
			GOWA_VPC: { fetch: gowaFetch },
		}), {
			type: "otp_delivery",
			phone: "6285795717974",
			otp: "123456",
			purpose: "login",
			challenge_id: id,
			request_id: "req_test_fallback",
		});

		expect(result).toEqual({ delivery_status: "sent", delivery_mode: "direct_fallback" });
		expect(gowaFetch).toHaveBeenCalledOnce();
		const [, request] = gowaFetch.mock.calls[0];
		expect(request.headers["x-device-id"]).toBe("punyatop1");
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, id)).delivery_status).toBe("sent");
	});

	it("marks delivery failed and rejects instead of reporting a false success", async () => {
		const id = challengeId();
		await seedChallenge(id);
		await expect(enqueueOtpDelivery(testEnv({
			OTP_QUEUE: { send: vi.fn(async () => { throw new Error("queue_unavailable"); }) },
			GOWA_VPC: { fetch: vi.fn(async () => new Response("down", { status: 503 })) },
		}), {
			type: "otp_delivery",
			phone: "6285795717974",
			otp: "123456",
			purpose: "login",
			challenge_id: id,
			request_id: "req_test_failure",
		})).rejects.toMatchObject({ code: "otp_delivery_failed", status: 503 });
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, id)).delivery_status).toBe("failed");
	});

	it("consumer marks sent and acknowledges only the successful message", async () => {
		const id = challengeId();
		await seedChallenge(id);
		const ack = vi.fn();
		const retry = vi.fn();
		const gowaFetch = vi.fn(async () => new Response("{}", { status: 200 }));
		await handleQueue({ messages: [{
			body: {
				type: "otp_delivery",
				phone: "6285795717974",
				otp: "123456",
				purpose: "login",
				challenge_id: id,
				request_id: "req_test_consumer",
			},
			attempts: 1,
			ack,
			retry,
		}] }, testEnv({ GOWA_VPC: { fetch: gowaFetch } }), {});

		expect(ack).toHaveBeenCalledOnce();
		expect(retry).not.toHaveBeenCalled();
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, id)).delivery_status).toBe("sent");
	});

	it("retries a failed queue message without blocking the next OTP", async () => {
		const failedId = challengeId();
		const sentId = challengeId();
		await seedChallenge(failedId);
		await seedChallenge(sentId);
		const failedAck = vi.fn();
		const failedRetry = vi.fn();
		const sentAck = vi.fn();
		const gowaFetch = vi.fn()
			.mockResolvedValueOnce(new Response("down", { status: 503 }))
			.mockResolvedValueOnce(new Response("{}", { status: 200 }));
		const message = (id, requestId, ack, retry) => ({
			body: {
				type: "otp_delivery",
				phone: "6285795717974",
				otp: "123456",
				purpose: "login",
				challenge_id: id,
				request_id: requestId,
			},
			attempts: 1,
			ack,
			retry,
		});
		await handleQueue({ messages: [
			message(failedId, "req_retry_failed", failedAck, failedRetry),
			message(sentId, "req_retry_sent", sentAck, vi.fn()),
		] }, testEnv({ GOWA_VPC: { fetch: gowaFetch } }), {});

		expect(failedAck).not.toHaveBeenCalled();
		expect(failedRetry).toHaveBeenCalledWith({ delaySeconds: 5 });
		expect(sentAck).toHaveBeenCalledOnce();
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, failedId)).delivery_status).toBe("retrying");
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, sentId)).delivery_status).toBe("sent");
	});

	it("exposes safe status data to the frontend", async () => {
		const id = challengeId();
		await seedChallenge(id);
		const response = await worker.fetch(
			new Request(`https://irwanmotor.test/auth/otp/status?challenge_id=${encodeURIComponent(id)}`),
			testEnv(),
			{ waitUntil() {} },
		);
		const data = await response.json();
		expect(response.status).toBe(200);
		expect(data.challenge_id).toBe(id);
		expect(data.phone).toBe("6285****974");
		expect(data).not.toHaveProperty("otp_hash");
	});

	it("resend endpoint replaces the challenge and queues a new OTP", async () => {
		const oldId = challengeId();
		await seedChallenge(oldId);
		const send = vi.fn(async () => {});
		const response = await worker.fetch(new Request("https://irwanmotor.test/auth/otp/resend", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ challenge_id: oldId }),
		}), testEnv({ OTP_QUEUE: { send } }), { waitUntil() {} });
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.challenge_id).not.toBe(oldId);
		expect(data.delivery_status).toBe("queued");
		expect(send.mock.calls[0][0].challenge_id).toBe(data.challenge_id);
		expect((await getOtpChallenge({ AUTH_DB: env.AUTH_DB }, oldId)).used_at).toBeTruthy();
	});
});
