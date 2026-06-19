import { bytesToBase64Url, base64UrlToBytes, textToBytes, timingSafeEqual } from "./crypto.js";

const DEFAULT_ITERATIONS = 100000;

function iterationCount(env, override) {
	const raw = override || env.PASSWORD_PBKDF2_ITERATIONS || DEFAULT_ITERATIONS;
	const parsed = Number(raw);
	return Number.isFinite(parsed) && parsed >= 10000 ? Math.floor(parsed) : DEFAULT_ITERATIONS;
}

async function derive(password, saltBytes, pepper, iterations) {
	const key = await crypto.subtle.importKey("raw", textToBytes(`${password}${pepper || ""}`), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
		key,
		256,
	);
	return new Uint8Array(bits);
}

export async function hashPassword(env, password, iterationsOverride) {
	const saltBytes = new Uint8Array(16);
	crypto.getRandomValues(saltBytes);
	const iterations = iterationCount(env, iterationsOverride);
	const hashBytes = await derive(password, saltBytes, env.PASSWORD_PEPPER, iterations);
	return {
		secret_hash: bytesToBase64Url(hashBytes),
		salt: bytesToBase64Url(saltBytes),
		hash_algorithm: "PBKDF2-HMAC-SHA256",
		iterations,
	};
}

export async function verifyPassword(env, password, credential) {
	if (!credential?.enabled || credential.hash_algorithm !== "PBKDF2-HMAC-SHA256") return false;
	const hashBytes = await derive(password, base64UrlToBytes(credential.salt), env.PASSWORD_PEPPER, credential.iterations);
	return timingSafeEqual(bytesToBase64Url(hashBytes), credential.secret_hash);
}
