export async function createOtpChallenge(env, challenge) {
	await env.AUTH_DB.prepare(
		`INSERT INTO otp_challenges (id,phone,user_id,purpose,otp_hash,max_attempts,expires_at,metadata_json)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	).bind(
		challenge.id,
		challenge.phone,
		challenge.user_id || null,
		challenge.purpose,
		challenge.otp_hash,
		challenge.max_attempts,
		challenge.expires_at,
		challenge.metadata_json || null,
	).run();
	return challenge;
}

export async function getOtpChallenge(env, id) {
	return env.AUTH_DB.prepare("SELECT * FROM otp_challenges WHERE id = ?").bind(id).first();
}

export async function incrementOtpAttempt(env, id) {
	await env.AUTH_DB.prepare("UPDATE otp_challenges SET attempt_count = attempt_count + 1 WHERE id = ?").bind(id).run();
}

export async function markOtpUsed(env, id) {
	await env.AUTH_DB.prepare("UPDATE otp_challenges SET used_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
}

export async function cleanupExpiredOtp(env) {
	return env.AUTH_DB.prepare("DELETE FROM otp_challenges WHERE expires_at <= CURRENT_TIMESTAMP OR used_at IS NOT NULL").run();
}
