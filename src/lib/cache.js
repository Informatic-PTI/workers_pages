export async function cacheGetJson(env, key) {
	if (!env.AUTH_CACHE) return null;
	const value = await env.AUTH_CACHE.get(key);
	return value ? JSON.parse(value) : null;
}

export async function cachePutJson(env, key, value, ttlSeconds) {
	if (!env.AUTH_CACHE) return;
	await env.AUTH_CACHE.put(key, JSON.stringify(value), { expirationTtl: Number(ttlSeconds || 60) });
}

export async function cacheDelete(env, key) {
	if (!env.AUTH_CACHE) return;
	await env.AUTH_CACHE.delete(key);
}
