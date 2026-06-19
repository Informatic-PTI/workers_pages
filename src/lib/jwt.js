import { base64UrlToBytes, bytesToBase64Url, textToBytes, timingSafeEqual } from "./crypto.js";

async function hmacKey(secret, usage) {
	return crypto.subtle.importKey("raw", textToBytes(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

function encodeJson(data) {
	return bytesToBase64Url(textToBytes(JSON.stringify(data)));
}

function decodeJson(part) {
	return JSON.parse(new TextDecoder().decode(base64UrlToBytes(part)));
}

export async function signAccessToken(env, { user, sessionId, ttlSeconds = null }) {
	const now = Math.floor(Date.now() / 1000);
	const ttl = Number(ttlSeconds || env.ACCESS_TOKEN_TTL_SECONDS || 900);
	const payload = {
		iss: env.AUTH_ISSUER,
		aud: env.AUTH_AUDIENCE,
		sub: user.id,
		sid: sessionId,
		iat: now,
		exp: now + ttl,
		type: "access",
		is_hyperuser: Boolean(user.is_hyperuser),
	};
	const header = { alg: "HS256", typ: "JWT" };
	const unsigned = `${encodeJson(header)}.${encodeJson(payload)}`;
	const signature = await crypto.subtle.sign("HMAC", await hmacKey(env.JWT_SECRET, "sign"), textToBytes(unsigned));
	return `${unsigned}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAccessToken(env, token) {
	const parts = String(token || "").split(".");
	if (parts.length !== 3) throw new Error("invalid_token");
	const [headerPart, payloadPart, signaturePart] = parts;
	const header = decodeJson(headerPart);
	if (header.alg !== "HS256") throw new Error("invalid_token");
	const unsigned = `${headerPart}.${payloadPart}`;
	const expected = await crypto.subtle.sign("HMAC", await hmacKey(env.JWT_SECRET, "sign"), textToBytes(unsigned));
	if (!timingSafeEqual(bytesToBase64Url(new Uint8Array(expected)), signaturePart)) throw new Error("invalid_token");
	const payload = decodeJson(payloadPart);
	const now = Math.floor(Date.now() / 1000);
	if (payload.exp <= now) {
		const err = new Error("token_expired");
		err.code = "token_expired";
		throw err;
	}
	if (payload.iss !== env.AUTH_ISSUER || payload.aud !== env.AUTH_AUDIENCE || payload.type !== "access") {
		throw new Error("invalid_token");
	}
	return payload;
}

export function bearerToken(request) {
	const header = request.headers.get("authorization") || "";
	const match = header.match(/^Bearer\s+(.+)$/i);
	return match ? match[1] : null;
}
