import { appCache } from "./bindings.js";

const PREFIX = "workshop:v1";

export const cacheKeys = {
	dashboard: () => `${PREFIX}:dashboard`,
	report: (from, to) => `${PREFIX}:report:${from}:${to}`,
};

export async function readAppCache(env, key) {
	const cache = appCache(env);
	if (!cache) return null;
	try {
		return await cache.get(key, "json");
	} catch {
		return null;
	}
}

export async function writeAppCache(env, key, value, ttlSeconds = 30) {
	const cache = appCache(env);
	if (!cache) return;
	try {
		await cache.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
	} catch {
		// Cache failure must never make the D1-backed operation fail.
	}
}
