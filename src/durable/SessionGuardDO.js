import { randomBase64Url } from "../lib/crypto.js";

export class SessionGuardDO {
	constructor(state) {
		this.state = state;
	}

	async fetch(request) {
		const url = new URL(request.url);
		const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
		if (url.pathname === "/acquire") return this.acquire(body);
		if (url.pathname === "/release") return this.release(body);
		return Response.json({ ok: false, code: "not_found" }, { status: 404 });
	}

	async acquire({ key, ttlSeconds = 15 }) {
		const now = Date.now();
		const storageKey = `lock:${key}`;
		const existing = await this.state.storage.get(storageKey);
		if (existing && existing.expires_at > now) {
			return Response.json({ ok: true, acquired: false, retry_after_seconds: Math.ceil((existing.expires_at - now) / 1000) });
		}
		const lock_token = randomBase64Url(18);
		await this.state.storage.put(storageKey, { lock_token, expires_at: now + ttlSeconds * 1000 }, { expirationTtl: ttlSeconds + 5 });
		return Response.json({ ok: true, acquired: true, lock_token });
	}

	async release({ key, lock_token }) {
		const storageKey = `lock:${key}`;
		const existing = await this.state.storage.get(storageKey);
		if (existing?.lock_token === lock_token) await this.state.storage.delete(storageKey);
		return Response.json({ ok: true });
	}
}
