export function appDb(env) {
	const binding = env.DB || env.AUTH_DB;
	if (!binding) throw new Error("missing_db_binding");
	return binding;
}

export function appCache(env) {
	return env.CACHE || env.AUTH_CACHE || null;
}

export function appBucket(env) {
	return env.BUCKET || null;
}
