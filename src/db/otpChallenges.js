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

export async function markOtpQueued(env, id) {
	await env.AUTH_DB.prepare(
		`UPDATE otp_challenges
		 SET delivery_status = CASE WHEN delivery_status = 'sent' THEN 'sent' ELSE 'queued' END,
		     queued_at = COALESCE(queued_at, CURRENT_TIMESTAMP),
		     last_delivery_at = CURRENT_TIMESTAMP,
		     delivery_error = NULL
		 WHERE id = ?`,
	).bind(id).run();
}

export async function markOtpSending(env, id) {
	await env.AUTH_DB.prepare(
		`UPDATE otp_challenges
		 SET delivery_status = 'sending',
		     delivery_attempts = delivery_attempts + 1,
		     last_delivery_at = CURRENT_TIMESTAMP,
		     delivery_error = NULL
		 WHERE id = ? AND used_at IS NULL`,
	).bind(id).run();
}

export async function markOtpSent(env, id) {
	await env.AUTH_DB.prepare(
		`UPDATE otp_challenges
		 SET delivery_status = 'sent',
		     sent_at = CURRENT_TIMESTAMP,
		     last_delivery_at = CURRENT_TIMESTAMP,
		     delivery_error = NULL
		 WHERE id = ?`,
	).bind(id).run();
}

export async function markOtpDeliveryFailed(env, id, error, retrying = false) {
	const safeError = String(error?.message || error || "otp_delivery_failed").slice(0, 240);
	await env.AUTH_DB.prepare(
		`UPDATE otp_challenges
		 SET delivery_status = ?,
		     last_delivery_at = CURRENT_TIMESTAMP,
		     delivery_error = ?
		 WHERE id = ?`,
	).bind(retrying ? "retrying" : "failed", safeError, id).run();
}

export async function expireOtpChallenge(env, id) {
	await env.AUTH_DB.prepare(
		"UPDATE otp_challenges SET used_at = CURRENT_TIMESTAMP WHERE id = ? AND used_at IS NULL",
	).bind(id).run();
}

export async function cleanupExpiredOtp(env) {
	return env.AUTH_DB.prepare("DELETE FROM otp_challenges WHERE expires_at <= CURRENT_TIMESTAMP OR used_at IS NOT NULL").run();
}
