import { describe, expect, it } from "vitest";
import worker from "../src/index.js";
import { normalizePhone } from "../src/lib/phone.js";

const env = {
	AUTH_DB: {
		prepare() {
			return { first: async () => ({ ok: 1 }) };
		},
	},
	AUTH_CACHE: null,
	AUTH_BACKUP_BUCKET: null,
	OTP_QUEUE: null,
	AUDIT_QUEUE: null,
};

describe("irwanmotor auth", () => {
	it("normalizes Indonesian phone numbers", () => {
		expect(normalizePhone("085795717974")).toBe("6285795717974");
		expect(normalizePhone("+6285795717974")).toBe("6285795717974");
	});

	it("returns a health response", async () => {
		const response = await worker.fetch(new Request("https://irwanmotor.example/health"), env, { waitUntil() {} });
		const data = await response.json();
		expect(data.ok).toBe(true);
		expect(data.service).toBe("irwanmotor-auth");
	});

	it("serves the hyperdashboard shell", async () => {
		const response = await worker.fetch(new Request("https://irwanmotor.example/dashboard"), env, { waitUntil() {} });
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/html");
		expect(await response.text()).toContain("Irwan Motor Auth Dashboard");
	});
});
