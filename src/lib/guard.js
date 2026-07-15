import { bearerToken, verifyAccessToken } from "./jwt.js";
import { httpError } from "./response.js";
import { getUser } from "../db/users.js";
import { getSession } from "../db/sessions.js";
import { getNumberSetting } from "../db/settings.js";
import { cacheGetJson, cachePutJson } from "./cache.js";

export async function requireAuth(request, env, request_id) {
	const token = bearerToken(request);
	if (!token) throw httpError("unauthorized", "Unauthorized", 401, request_id);
	let claims;
	try {
		claims = await verifyAccessToken(env, token);
	} catch (error) {
		throw httpError(error.code || "unauthorized", error.code === "token_expired" ? "Token expired" : "Unauthorized", 401, request_id);
	}
	const sessionKey = `sess:${claims.sid}`;
	let session = await cacheGetJson(env, sessionKey);
	if (!session) {
		session = await getSession(env, claims.sid);
		if (session?.status === "active") await cachePutJson(env, sessionKey, session, await getNumberSetting(env, "session_cache_ttl_seconds"));
	}
	if (!session || session.status !== "active" || new Date(session.expires_at).getTime() <= Date.now()) {
		throw httpError("unauthorized", "Unauthorized", 401, request_id);
	}
	const user = await getUser(env, claims.sub);
	if (!user || user.status !== "active") throw httpError("unauthorized", "Unauthorized", 401, request_id);
	return { user, session, claims, token };
}

export async function resetRateLimit(env, key) {
	if (!env.AUTH_RATE_LIMITER) return { ok: true, skipped: true };
	const id = env.AUTH_RATE_LIMITER.idFromName(key);
	const stub = env.AUTH_RATE_LIMITER.get(id);
	const res = await stub.fetch("https://rate-limit/reset", {
		method: "POST",
		body: JSON.stringify({ key }),
		headers: { "content-type": "application/json" },
	});

	return res.json();
}

export async function getRateLimitState(env, key, windowSeconds, maxAttempts) {
	if (!env.AUTH_RATE_LIMITER) return { ok: true, allowed: true, skipped: true, state: null, retry_after_seconds: 0 };
	const id = env.AUTH_RATE_LIMITER.idFromName(key);
	const stub = env.AUTH_RATE_LIMITER.get(id);
	const res = await stub.fetch("https://rate-limit/check", {
		method: "POST",
		body: JSON.stringify({ key, windowSeconds, maxAttempts }),
		headers: { "content-type": "application/json" },
	});
	return res.json();
}

export async function readRateLimitState(env, key) {
	if (!env.AUTH_RATE_LIMITER) return { ok: true, skipped: true, state: null };
	const id = env.AUTH_RATE_LIMITER.idFromName(key);
	const stub = env.AUTH_RATE_LIMITER.get(id);
	const res = await stub.fetch("https://rate-limit/state", {
		method: "POST",
		body: JSON.stringify({ key }),
		headers: { "content-type": "application/json" },
	});
	return res.json();
}

export async function acquireSessionLock(env, key) {
	if (!env.AUTH_SESSION_GUARD) return { acquired: true, release: async () => {} };
	const id = env.AUTH_SESSION_GUARD.idFromName(key);
	const stub = env.AUTH_SESSION_GUARD.get(id);
	const res = await stub.fetch("https://session-guard/acquire", {
		method: "POST",
		body: JSON.stringify({ key }),
		headers: { "content-type": "application/json" },
	});
	const data = await res.json();
	return {
		...data,
		release: async () => {
			if (!data.lock_token) return;
			await stub.fetch("https://session-guard/release", {
				method: "POST",
				body: JSON.stringify({ key, lock_token: data.lock_token }),
				headers: { "content-type": "application/json" },
			});
		},
	};
}
