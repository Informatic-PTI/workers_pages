export class RateLimitDO {
	constructor(state) {
		this.state = state;
	}

	async fetch(request) {
		const url = new URL(request.url);
		const body = request.method === "POST" ? await request.json().catch(() => ({})) : {};
		if (url.pathname === "/check") return this.checkAndIncrement(body);
		if (url.pathname === "/reset") return this.reset(body);
		if (url.pathname === "/state") return this.getState(body);
		return Response.json({ ok: false, code: "not_found" }, { status: 404 });
	}

	async checkAndIncrement({ key, windowSeconds = 60, maxAttempts = 5 }) {
		const now = Date.now();
		const record = (await this.state.storage.get(key)) || { count: 0, reset_at: now + windowSeconds * 1000 };
		if (record.reset_at <= now) {
			record.count = 0;
			record.reset_at = now + windowSeconds * 1000;
		}
		record.count += 1;
		await this.state.storage.put(key, record, { expirationTtl: Number(windowSeconds) + 60 });
		const allowed = record.count <= Number(maxAttempts);
		return Response.json({
			ok: true,
			allowed,
			count: record.count,
			remaining: Math.max(0, Number(maxAttempts) - record.count),
			retry_after_seconds: allowed ? 0 : Math.max(1, Math.ceil((record.reset_at - now) / 1000)),
		});
	}

	async reset({ key }) {
		await this.state.storage.delete(key);
		return Response.json({ ok: true });
	}

	async getState({ key }) {
		return Response.json({ ok: true, state: (await this.state.storage.get(key)) || null });
	}
}
