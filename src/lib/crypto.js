const encoder = new TextEncoder();

export function bytesToBase64Url(bytes) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function base64UrlToBytes(value) {
	const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
	const binary = atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function textToBytes(value) {
	return encoder.encode(value);
}

export async function sha256Hex(value) {
	const bytes = typeof value === "string" ? textToBytes(value) : value;
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomBase64Url(byteLength = 32) {
	const bytes = new Uint8Array(byteLength);
	crypto.getRandomValues(bytes);
	return bytesToBase64Url(bytes);
}

export function randomId(prefix, byteLength = 12) {
	return `${prefix}_${randomBase64Url(byteLength)}`;
}

export function randomDigits(length = 6) {
	const out = [];
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	for (const byte of bytes) out.push(String(byte % 10));
	return out.join("");
}

export function timingSafeEqual(a, b) {
	const left = typeof a === "string" ? textToBytes(a) : a;
	const right = typeof b === "string" ? textToBytes(b) : b;
	let diff = left.length ^ right.length;
	const length = Math.max(left.length, right.length);
	for (let i = 0; i < length; i++) diff |= (left[i] || 0) ^ (right[i] || 0);
	return diff === 0;
}
