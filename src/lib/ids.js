const ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function validatePrefix(prefix = "US") {
	if (!/^[A-Za-z0-9]{2,4}$/.test(prefix)) throw new Error("invalid_id_prefix");
	return prefix;
}

export function randomUserId(prefix = "US") {
	const clean = validatePrefix(prefix);
	const randomLength = 10 - clean.length;
	const bytes = new Uint8Array(randomLength);
	crypto.getRandomValues(bytes);
	let out = clean;
	for (const byte of bytes) out += ALPHANUM[byte % ALPHANUM.length];
	return out;
}

export async function generateUserId(env, prefix = "US") {
	for (let i = 0; i < 5; i++) {
		const id = randomUserId(prefix);
		const row = await env.AUTH_DB.prepare("SELECT id FROM users WHERE id = ?").bind(id).first();
		if (!row) return id;
	}
	throw new Error("user_id_collision");
}

export function nowIso() {
	return new Date().toISOString();
}

export function addSeconds(seconds) {
	return new Date(Date.now() + Number(seconds) * 1000).toISOString();
}

export function addDays(days) {
	return new Date(Date.now() + Number(days) * 86400 * 1000).toISOString();
}
