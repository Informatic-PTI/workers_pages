import { createPasswordCredential, findUserAndPasswordCredentialByIdentifier } from "../db/credentials.js";
import {
	createOtpChallenge,
	expireOtpChallenge,
	getOtpChallenge,
	incrementOtpAttempt,
	markOtpDeliveryFailed,
	markOtpQueued,
	markOtpSending,
	markOtpSent,
	markOtpUsed,
} from "../db/otpChallenges.js";
import { hasPermission, permissionsForUser, rolesForUser } from "../db/permissions.js";
import { createRefreshToken, findRefreshTokenByPlaintext, revokeRefreshTokenFamily, revokeRefreshTokensBySession, revokeRefreshTokensByUser, rotateRefreshToken } from "../db/refreshTokens.js";
import { createSession, listSessionsForUser, revokeSession, revokeUserSessions, touchSession } from "../db/sessions.js";
import { getNumberSetting, getUserAccessTtlSeconds, getUserRefreshTtlDays, getUserSkipOtp } from "../db/settings.js";
import { createUser, findUserByIdentifier, getUser, userConflict } from "../db/users.js";
import { auditEvent } from "../lib/audit.js";
import { cacheDelete } from "../lib/cache.js";
import { acquireSessionLock, getRateLimitState, requireAuth } from "../lib/guard.js";
import { generateUserId } from "../lib/ids.js";
import { signAccessToken } from "../lib/jwt.js";
import { generateOtp, hashOtp, newOtpChallengeId, verifyOtpHash } from "../lib/otp.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { maskEmail, maskPhone, normalizeEmail, normalizePhone } from "../lib/phone.js";
import { isAdminRequest, requestMeta } from "../lib/request.js";
import { fail, httpError, ok, readJson } from "../lib/response.js";
import { addSeconds } from "../lib/ids.js";

function publicUser(user) {
	return {
		id: user.id,
		email: user.email ? maskEmail(user.email) : null,
		phone: user.phone ? maskPhone(user.phone) : null,
		username: user.username || null,
		display_name: user.display_name || null,
		status: user.status,
		is_hyperuser: Boolean(user.is_hyperuser),
	};
}

function background(ctx, promise) {
	if (ctx?.waitUntil) ctx.waitUntil(promise);
	else return promise;
	return Promise.resolve();
}

async function bestEffortAudit(env, event) {
	try { await auditEvent(env, event); } catch { /* Delivery must not be duplicated because its audit write failed. */ }
}

export async function enqueueOtpDelivery(env, payload, auditBase = {}) {
	const target = { target_type: "otp_challenge", target_id: payload.challenge_id };
	let queueError = null;
	if (env.OTP_QUEUE?.send) {
		try {
			// Awaiting send is intentional: a challenge is only returned after Cloudflare accepts it.
			await env.OTP_QUEUE.send(payload);
		} catch (error) {
			queueError = error;
			await bestEffortAudit(env, {
				...auditBase,
				...target,
				event_type: "otp_delivery_queue_failed",
				outcome: "failure",
				reason_code: error?.message || "otp_queue_failed",
			});
		}
		if (!queueError) {
			try { await markOtpQueued(env, payload.challenge_id); } catch { /* Consumer also updates the delivery state. */ }
			await bestEffortAudit(env, { ...auditBase, ...target, event_type: "otp_delivery_queued", outcome: "success" });
			return { delivery_status: "queued", delivery_mode: "queue" };
		}
	}

	if (String(env.ENABLE_DIRECT_OTP_FALLBACK || "true") === "true") {
		try {
			const { sendWhatsAppOtp } = await import("../lib/gowa.js");
			await markOtpSending(env, payload.challenge_id);
			await sendWhatsAppOtp(env, {
				phone: payload.phone,
				otp: payload.otp,
				purpose: payload.purpose,
				requestId: payload.request_id,
			});
			try { await markOtpSent(env, payload.challenge_id); } catch { /* GOWA already accepted the message. */ }
			await bestEffortAudit(env, {
				...auditBase,
				...target,
				event_type: "otp_delivery_success",
				outcome: "success",
				metadata: { delivery_mode: queueError ? "direct_fallback" : "direct" },
			});
			return { delivery_status: "sent", delivery_mode: queueError ? "direct_fallback" : "direct" };
		} catch (error) {
			await markOtpDeliveryFailed(env, payload.challenge_id, error);
			await bestEffortAudit(env, {
				...auditBase,
				...target,
				event_type: "gowa_otp_send_failed",
				outcome: "failure",
				reason_code: error?.message || "gowa_send_failed",
			});
			throw httpError("otp_delivery_failed", "OTP tidak dapat dikirim ke WhatsApp", 503, payload.request_id, {
				challenge_id: payload.challenge_id,
				delivery_status: "failed",
			});
		}
	}

	const unavailable = queueError || new Error("otp_delivery_unavailable");
	await markOtpDeliveryFailed(env, payload.challenge_id, unavailable);
	throw httpError("otp_delivery_failed", "Layanan pengiriman OTP tidak tersedia", 503, payload.request_id, {
		challenge_id: payload.challenge_id,
		delivery_status: "failed",
	});
}

function timestampMs(value) {
	if (!value) return Number.NaN;
	const text = String(value);
	return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(text) ? text : `${text.replace(" ", "T")}Z`);
}

function otpPublicStatus(challenge, cooldownSeconds) {
	const expiresIn = Math.max(0, Math.ceil((timestampMs(challenge.expires_at) - Date.now()) / 1000));
	const retryAfter = Math.max(0, Math.ceil((timestampMs(challenge.created_at) + (cooldownSeconds * 1000) - Date.now()) / 1000));
	return {
		challenge_id: challenge.id,
		purpose: challenge.purpose,
		phone: maskPhone(challenge.phone),
		delivery_status: challenge.delivery_status || "pending",
		delivery_attempts: Number(challenge.delivery_attempts || 0),
		expires_in: expiresIn,
		expired: expiresIn <= 0 || Boolean(challenge.used_at),
		can_resend: retryAfter <= 0 && expiresIn > 0 && !challenge.used_at,
		retry_after_seconds: retryAfter,
		sent_at: challenge.sent_at || null,
	};
}

async function authResponse(env, user, sessionId, refreshFamilyId = null) {
	const [accessTtl, refreshTtlDays] = await Promise.all([
		getUserAccessTtlSeconds(env, user.id),
		getUserRefreshTtlDays(env, user.id),
	]);
	const access_token = await signAccessToken(env, { user, sessionId, ttlSeconds: accessTtl });
	const refresh = await createRefreshToken(env, { userId: user.id, sessionId, familyId: refreshFamilyId, ttlDays: refreshTtlDays });
	return {
		token_type: "Bearer",
		access_token,
		expires_in: accessTtl,
		refresh_token: refresh.token,
		refresh_expires_in: refreshTtlDays * 86400,
		user: publicUser(user),
	};
}

async function createSessionResponse(env, request, user, request_id, existingMeta = null) {
	const meta = existingMeta || await requestMeta(request);
	const session = await createSession(env, user.id, meta, await getUserRefreshTtlDays(env, user.id));
	const data = await authResponse(env, user, session.id);
	return { data, session, meta };
}

async function startOtp(env, ctx, request, request_id, purpose) {
	const body = await readJson(request, request_id);
	const phone = normalizePhone(body.phone);
	if (!phone) throw httpError("validation_error", "Invalid phone", 400, request_id);
	const meta = await requestMeta(request);
	const otpCooldown = await getNumberSetting(env, "otp_resend_cooldown_seconds");
	const otpTtl = await getNumberSetting(env, "otp_ttl_seconds");
	const otpMaxAttempts = await getNumberSetting(env, "otp_max_attempts");
	const limit = await getRateLimitState(env, `ratelimit:otp:phone:${phone}`, otpCooldown, 1);
	if (!limit.allowed) return fail("rate_limited", "Rate limited", request_id, 429, { retry_after_seconds: limit.retry_after_seconds });
	const user = await findUserByIdentifier(env, phone);
	if (purpose === "login" && !user) throw httpError("not_found", "User not found", 404, request_id);
	if (purpose === "register" && user) throw httpError("conflict", "Phone already registered", 409, request_id);
	const challengeId = newOtpChallengeId();
	const otp = generateOtp();
	await createOtpChallenge(env, {
		id: challengeId,
		phone,
		user_id: user?.id || null,
		purpose,
		otp_hash: await hashOtp(env, challengeId, otp),
		max_attempts: otpMaxAttempts,
		expires_at: addSeconds(otpTtl),
	});
	const payload = { type: "otp_delivery", phone, otp, purpose, challenge_id: challengeId, request_id };
	const delivery = await enqueueOtpDelivery(env, payload, { request_id, ip_hash: meta.ip_hash, user_id: user?.id });
	await background(ctx, auditEvent(env, { event_type: purpose === "login" ? "login_started" : "register_started", outcome: "success", request_id, ip_hash: meta.ip_hash, user_id: user?.id }));
	return ok({ otp_required: true, challenge_id: challengeId, expires_in: otpTtl, retry_after_seconds: otpCooldown, phone: maskPhone(phone), ...delivery }, request_id);
}

async function startRegistration(env, ctx, request, request_id) {
	const body = await readJson(request, request_id);
	const email = normalizeEmail(body.email);
	const phone = normalizePhone(body.phone);
	const username = body.username ? String(body.username).trim() : null;
	const displayName = body.display_name ? String(body.display_name).trim() : null;
	const password = String(body.password || "");
	if (!email) throw httpError("validation_error", "Valid email is required", 400, request_id);
	if (!phone) throw httpError("validation_error", "Valid phone is required", 400, request_id);
	if (password.length < 8) throw httpError("validation_error", "Password must be at least 8 characters", 400, request_id);
	if (await userConflict(env, { email, phone, username })) throw httpError("conflict", "User already exists", 409, request_id);
	const meta = await requestMeta(request);
	const otpCooldown = await getNumberSetting(env, "otp_resend_cooldown_seconds");
	const otpTtl = await getNumberSetting(env, "otp_ttl_seconds");
	const otpMaxAttempts = await getNumberSetting(env, "otp_max_attempts");
	const limit = await getRateLimitState(env, `ratelimit:otp:phone:${phone}`, otpCooldown, 1);
	if (!limit.allowed) return fail("rate_limited", "Rate limited", request_id, 429, { retry_after_seconds: limit.retry_after_seconds });
	const challengeId = newOtpChallengeId();
	const otp = generateOtp();
	const passwordHash = await hashPassword(env, password);
	await createOtpChallenge(env, {
		id: challengeId,
		phone,
		user_id: null,
		purpose: "register",
		otp_hash: await hashOtp(env, challengeId, otp),
		max_attempts: otpMaxAttempts,
		expires_at: addSeconds(otpTtl),
		metadata_json: JSON.stringify({
			id_prefix: body.id_prefix || "US",
			email,
			phone,
			username,
			display_name: displayName,
			password_hash: passwordHash,
		}),
	});
	const payload = { type: "otp_delivery", phone, otp, purpose: "register", challenge_id: challengeId, request_id };
	const delivery = await enqueueOtpDelivery(env, payload, { request_id, ip_hash: meta.ip_hash });
	await background(ctx, auditEvent(env, { event_type: "register_started", outcome: "success", request_id, ip_hash: meta.ip_hash, metadata: { email, phone: maskPhone(phone) } }));
	return ok({
		otp_required: true,
		challenge_id: challengeId,
		expires_in: otpTtl,
		retry_after_seconds: otpCooldown,
		phone: maskPhone(phone),
		...delivery,
		next: "/auth/register/verify",
	}, request_id);
}

async function queueLoginOtp(env, ctx, { user, request_id, meta }) {
	if (!user.phone) throw httpError("otp_phone_required", "Nomor WhatsApp akun wajib diisi untuk login OTP", 400, request_id);
	const otpCooldown = await getNumberSetting(env, "otp_resend_cooldown_seconds");
	const otpTtl = await getNumberSetting(env, "otp_ttl_seconds");
	const otpMaxAttempts = await getNumberSetting(env, "otp_max_attempts");
	const limit = await getRateLimitState(env, `ratelimit:otp:phone:${user.phone}`, otpCooldown, 1);
	if (!limit.allowed) return fail("rate_limited", "Rate limited", request_id, 429, { retry_after_seconds: limit.retry_after_seconds });
	const challengeId = newOtpChallengeId();
	const otp = generateOtp();
	await createOtpChallenge(env, {
		id: challengeId,
		phone: user.phone,
		user_id: user.id,
		purpose: "login",
		otp_hash: await hashOtp(env, challengeId, otp),
		max_attempts: otpMaxAttempts,
		expires_at: addSeconds(otpTtl),
	});
	const payload = { type: "otp_delivery", phone: user.phone, otp, purpose: "login", challenge_id: challengeId, request_id };
	const delivery = await enqueueOtpDelivery(env, payload, { request_id, ip_hash: meta.ip_hash, user_id: user.id });
	await background(ctx, auditEvent(env, { event_type: "login_password_success", outcome: "success", request_id, user_id: user.id, ip_hash: meta.ip_hash, metadata: { next_step: "otp_verify" } }));
	return ok({
		otp_required: true,
		challenge_id: challengeId,
		expires_in: otpTtl,
		retry_after_seconds: otpCooldown,
		phone: maskPhone(user.phone),
		...delivery,
		next: "/auth/login/verify",
	}, request_id);
}

async function otpStatus(env, request, request_id) {
	const challengeId = new URL(request.url).searchParams.get("challenge_id");
	if (!challengeId) throw httpError("validation_error", "challenge_id wajib diisi", 400, request_id);
	const challenge = await getOtpChallenge(env, challengeId);
	if (!challenge) throw httpError("not_found", "Challenge OTP tidak ditemukan", 404, request_id);
	const cooldown = await getNumberSetting(env, "otp_resend_cooldown_seconds");
	return ok(otpPublicStatus(challenge, cooldown), request_id);
}

async function resendOtp(env, request, request_id) {
	const body = await readJson(request, request_id);
	const current = await getOtpChallenge(env, body.challenge_id);
	if (!current || current.used_at || timestampMs(current.expires_at) <= Date.now() || !["login", "register"].includes(current.purpose)) {
		throw httpError("invalid_otp_challenge", "Challenge OTP sudah tidak berlaku", 400, request_id);
	}
	const [otpCooldown, otpTtl, otpMaxAttempts] = await Promise.all([
		getNumberSetting(env, "otp_resend_cooldown_seconds"),
		getNumberSetting(env, "otp_ttl_seconds"),
		getNumberSetting(env, "otp_max_attempts"),
	]);
	const limit = await getRateLimitState(env, `ratelimit:otp:phone:${current.phone}`, otpCooldown, 1);
	if (!limit.allowed) {
		return fail("rate_limited", "Tunggu sebelum mengirim ulang OTP", request_id, 429, {
			retry_after_seconds: limit.retry_after_seconds,
			challenge_id: current.id,
		});
	}
	const challengeId = newOtpChallengeId();
	const otp = generateOtp();
	await createOtpChallenge(env, {
		id: challengeId,
		phone: current.phone,
		user_id: current.user_id,
		purpose: current.purpose,
		otp_hash: await hashOtp(env, challengeId, otp),
		max_attempts: otpMaxAttempts,
		expires_at: addSeconds(otpTtl),
		metadata_json: current.metadata_json || null,
	});
	const meta = await requestMeta(request);
	const payload = { type: "otp_delivery", phone: current.phone, otp, purpose: current.purpose, challenge_id: challengeId, request_id };
	const delivery = await enqueueOtpDelivery(env, payload, { request_id, ip_hash: meta.ip_hash, user_id: current.user_id });
	await expireOtpChallenge(env, current.id);
	await bestEffortAudit(env, {
		event_type: "otp_resent",
		outcome: "success",
		request_id,
		user_id: current.user_id,
		ip_hash: meta.ip_hash,
		target_type: "otp_challenge",
		target_id: challengeId,
	});
	return ok({
		otp_required: true,
		challenge_id: challengeId,
		expires_in: otpTtl,
		retry_after_seconds: otpCooldown,
		phone: maskPhone(current.phone),
		...delivery,
	}, request_id);
}

async function verifyOtp(env, request, request_id, purpose) {
	const body = await readJson(request, request_id);
	const challenge = await getOtpChallenge(env, body.challenge_id);
	if (!challenge || challenge.purpose !== purpose || challenge.used_at || new Date(challenge.expires_at).getTime() <= Date.now()) {
		throw httpError("invalid_otp", "Invalid OTP", 401, request_id);
	}
	if (challenge.attempt_count >= challenge.max_attempts) throw httpError("invalid_otp", "Invalid OTP", 401, request_id);
	const valid = await verifyOtpHash(env, challenge.id, String(body.otp || ""), challenge.otp_hash);
	if (!valid) {
		await incrementOtpAttempt(env, challenge.id);
		await auditEvent(env, { event_type: "otp_failed", outcome: "failure", request_id, user_id: challenge.user_id });
		throw httpError("invalid_otp", "Invalid OTP", 401, request_id);
	}
	await markOtpUsed(env, challenge.id);
	let user;
	if (purpose === "login") {
		user = await getUser(env, challenge.user_id);
	} else {
		if (!challenge.metadata_json) throw httpError("validation_error", "Registration challenge metadata is missing", 400, request_id);
		const pending = JSON.parse(challenge.metadata_json);
		if (await userConflict(env, { email: pending.email, phone: pending.phone, username: pending.username })) {
			throw httpError("conflict", "User already exists", 409, request_id);
		}
		const id = await generateUserId(env, pending.id_prefix || "US");
		user = await createUser(env, {
			id,
			phone: pending.phone,
			email: pending.email,
			username: pending.username || null,
			display_name: pending.display_name || null,
		});
		await createPasswordCredential(env, user.id, pending.password_hash);
		await env.AUTH_DB.prepare("INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES (?, 'role_user_basic')").bind(user.id).run();
	}
	if (!user || user.status !== "active") throw httpError("unauthorized", "Unauthorized", 401, request_id);
	const { data, meta } = await createSessionResponse(env, request, user, request_id);
	await auditEvent(env, { event_type: purpose === "login" ? "login_success" : "register_success", outcome: "success", request_id, user_id: user.id, ip_hash: meta.ip_hash });
	return ok(data, request_id);
}

export async function handleAuth(request, env, ctx, request_id, parts) {
	const method = request.method;
	const leaf = parts.slice(1).join("/");

	if (method === "POST" && leaf === "login/password") {
		const body = await readJson(request, request_id);
		const meta = await requestMeta(request);
		const identifier = String(body.identifier || "").trim();
		const [byIdentifier, byIp] = await Promise.all([
			getRateLimitState(env, `ratelimit:login:identifier:${identifier.toLowerCase()}`, 300, 8),
			getRateLimitState(env, `ratelimit:login:ip:${meta.ip_hash}`, 300, 25),
		]);
		if (!byIdentifier.allowed || !byIp.allowed) return fail("rate_limited", "Rate limited", request_id, 429);
		const { user, credential } = await findUserAndPasswordCredentialByIdentifier(env, identifier);
		const valid = user?.status === "active" && credential && await verifyPassword(env, String(body.password || ""), credential);
		if (!valid) {
			await auditEvent(env, { event_type: "login_password_failed", outcome: "failure", request_id, ip_hash: meta.ip_hash, reason_code: "invalid_credentials" });
			return fail("invalid_credentials", "Invalid credentials", request_id, 401);
		}
		if (await getUserSkipOtp(env, user.id)) {
			const { data, session } = await createSessionResponse(env, request, user, request_id, meta);
			await background(ctx, auditEvent(env, {
				event_type: "login_password_success",
				outcome: "success",
				request_id,
				user_id: user.id,
				session_id: session.id,
				ip_hash: meta.ip_hash,
				metadata: { next_step: "session_created", skip_otp: true },
			}));
			await background(ctx, auditEvent(env, {
				event_type: "login_success",
				outcome: "success",
				request_id,
				user_id: user.id,
				session_id: session.id,
				ip_hash: meta.ip_hash,
				metadata: { auth_mode: "password_skip_otp" },
			}));
			return ok(data, request_id);
		}
		return queueLoginOtp(env, ctx, { user, request_id, meta });
	}

	if (method === "POST" && leaf === "register/password") return startRegistration(env, ctx, request, request_id);
	if (method === "POST" && leaf === "login/start") return startOtp(env, ctx, request, request_id, "login");
	if (method === "GET" && leaf === "otp/status") return otpStatus(env, request, request_id);
	if (method === "POST" && leaf === "otp/resend") return resendOtp(env, request, request_id);
	if (method === "POST" && leaf === "register/verify") return verifyOtp(env, request, request_id, "register");
	if (method === "POST" && leaf === "login/verify") return verifyOtp(env, request, request_id, "login");

	if (method === "POST" && leaf === "refresh") {
		const body = await readJson(request, request_id);
		const old = await findRefreshTokenByPlaintext(env, body.refresh_token);
		if (!old) return fail("unauthorized", "Unauthorized", request_id, 401);
		const lock = await acquireSessionLock(env, old.family_id || old.session_id);
		if (!lock.acquired) return fail("rate_limited", "Refresh in progress", request_id, 429, { retry_after_seconds: lock.retry_after_seconds });
		try {
			const current = await findRefreshTokenByPlaintext(env, body.refresh_token);
			if (!current || current.used_at || current.revoked_at || new Date(current.expires_at).getTime() <= Date.now()) {
				await revokeRefreshTokenFamily(env, old.family_id);
				await revokeSession(env, old.session_id);
				await cacheDelete(env, `sess:${old.session_id}`);
				await auditEvent(env, { event_type: "refresh_reuse_detected", outcome: "failure", request_id, user_id: old.user_id, session_id: old.session_id });
				return fail("unauthorized", "Unauthorized", request_id, 401);
			}
			const user = await getUser(env, current.user_id);
			const session = await import("../db/sessions.js").then((m) => m.getSession(env, current.session_id));
			if (!user || user.status !== "active" || !session || session.status !== "active") return fail("unauthorized", "Unauthorized", request_id, 401);
			const [refreshTtlDays, accessTtl] = await Promise.all([
				getUserRefreshTtlDays(env, user.id),
				getUserAccessTtlSeconds(env, user.id),
			]);
			const refresh = await rotateRefreshToken(env, current, refreshTtlDays);
			await touchSession(env, session.id);
			const access_token = await signAccessToken(env, { user, sessionId: session.id, ttlSeconds: accessTtl });
			await auditEvent(env, { event_type: "token_refreshed", outcome: "success", request_id, user_id: user.id, session_id: session.id });
			return ok({
				token_type: "Bearer",
				access_token,
				expires_in: accessTtl,
				refresh_token: refresh.token,
				refresh_expires_in: refreshTtlDays * 86400,
				user: publicUser(user),
			}, request_id);
		} finally {
			await lock.release();
		}
	}

	if (method === "GET" && leaf === "me") {
		const { user, session } = await requireAuth(request, env, request_id);
		const [permissions, roles] = await Promise.all([
			permissionsForUser(env, user.id, Boolean(user.is_hyperuser)),
			user.is_hyperuser ? Promise.resolve(["admin", "hyperuser"]) : rolesForUser(env, user.id),
		]);
		return ok({ user: publicUser(user), session_id: session.id, permissions, roles }, request_id);
	}

	if (method === "GET" && leaf === "sessions") {
		const { user } = await requireAuth(request, env, request_id);
		const rows = await listSessionsForUser(env, user.id);
		return ok({ sessions: rows.results || [] }, request_id);
	}

	if (method === "DELETE" && parts[1] === "sessions" && parts[2]) {
		const { user } = await requireAuth(request, env, request_id);
		const session = await import("../db/sessions.js").then((m) => m.getSession(env, parts[2]));
		if (!session || session.user_id !== user.id) throw httpError("not_found", "Not found", 404, request_id);
		await revokeSession(env, session.id);
		await revokeRefreshTokensBySession(env, session.id);
		await cacheDelete(env, `sess:${session.id}`);
		return ok({ revoked: true }, request_id);
	}

	if (method === "POST" && leaf === "logout") {
		const { user, session } = await requireAuth(request, env, request_id);
		await revokeSession(env, session.id);
		await revokeRefreshTokensBySession(env, session.id);
		await cacheDelete(env, `sess:${session.id}`);
		await auditEvent(env, { event_type: "logout", outcome: "success", request_id, user_id: user.id, session_id: session.id });
		return ok({ logged_out: true }, request_id);
	}

	if (method === "POST" && leaf === "logout-all") {
		const { user } = await requireAuth(request, env, request_id);
		await revokeUserSessions(env, user.id);
		await revokeRefreshTokensByUser(env, user.id);
		await cacheDelete(env, `perm:${user.id}`);
		await auditEvent(env, { event_type: "logout_all", outcome: "success", request_id, user_id: user.id });
		return ok({ logged_out_all: true }, request_id);
	}

	if (method === "POST" && leaf === "introspect") {
		if (!isAdminRequest(request, env)) throw httpError("forbidden", "Forbidden", 403, request_id);
		const body = await readJson(request, request_id);
		const fakeRequest = new Request(request.url, { headers: { authorization: `Bearer ${body.access_token || ""}` } });
		try {
			const { user, session, claims } = await requireAuth(fakeRequest, env, request_id);
			return ok({ active: true, user_id: user.id, session_id: session.id, claims }, request_id);
		} catch {
			return ok({ active: false }, request_id);
		}
	}

	if (method === "POST" && leaf === "require-permission") {
		if (!isAdminRequest(request, env)) throw httpError("forbidden", "Forbidden", 403, request_id);
		const body = await readJson(request, request_id);
		const token = body.access_token;
		const fakeRequest = new Request(request.url, { headers: { authorization: `Bearer ${token || ""}` } });
		const { user, session } = await requireAuth(fakeRequest, env, request_id);
		const allowed = await hasPermission(env, user, body.permission);
		if (!allowed) {
			await auditEvent(env, { event_type: "permission_denied", outcome: "failure", request_id, user_id: user.id, session_id: session.id, reason_code: body.permission });
			return ok({ allowed: false, user_id: user.id, session_id: session.id }, request_id);
		}
		return ok({ allowed: true, user_id: user.id, session_id: session.id }, request_id);
	}

	throw httpError("not_found", "Not found", 404, request_id);
}
