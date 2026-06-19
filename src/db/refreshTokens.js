import { addDays } from "../lib/ids.js";
import { hashRefreshToken, newFamilyId, newRefreshToken, newRefreshTokenId } from "../lib/token.js";

export async function createRefreshToken(env, { userId, sessionId, familyId, rotatedFrom, ttlDays = null }) {
	const token = newRefreshToken();
	const tokenHash = await hashRefreshToken(env, token);
	const id = newRefreshTokenId();
	const expiresAt = addDays(Number(ttlDays || env.REFRESH_TOKEN_TTL_DAYS || 30));
	await env.AUTH_DB.prepare(
		`INSERT INTO refresh_tokens (id,user_id,session_id,token_hash,family_id,rotated_from,expires_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
	).bind(id, userId, sessionId, tokenHash, familyId || newFamilyId(), rotatedFrom || null, expiresAt).run();
	return { id, token, token_hash: tokenHash, expires_at: expiresAt, family_id: familyId };
}

export async function findRefreshTokenByPlaintext(env, token) {
	const tokenHash = await hashRefreshToken(env, token);
	return env.AUTH_DB.prepare("SELECT * FROM refresh_tokens WHERE token_hash = ?").bind(tokenHash).first();
}

export async function rotateRefreshToken(env, oldToken, ttlDays = null) {
	await env.AUTH_DB.batch([
		env.AUTH_DB.prepare(
			"UPDATE refresh_tokens SET used_at = COALESCE(used_at, CURRENT_TIMESTAMP), revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE id = ?",
		).bind(oldToken.id),
	]);
	return createRefreshToken(env, {
		userId: oldToken.user_id,
		sessionId: oldToken.session_id,
		familyId: oldToken.family_id,
		rotatedFrom: oldToken.id,
		ttlDays,
	});
}

export async function revokeRefreshTokenFamily(env, familyId) {
	await env.AUTH_DB.prepare(
		"UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE family_id = ?",
	).bind(familyId).run();
}

export async function revokeRefreshTokensBySession(env, sessionId) {
	await env.AUTH_DB.prepare(
		"UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE session_id = ?",
	).bind(sessionId).run();
}

export async function revokeRefreshTokensByUser(env, userId) {
	await env.AUTH_DB.prepare(
		"UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE user_id = ?",
	).bind(userId).run();
}

export async function cleanupExpiredRefreshTokens(env) {
	return env.AUTH_DB.prepare(
		"UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE revoked_at IS NULL AND expires_at <= CURRENT_TIMESTAMP",
	).run();
}
