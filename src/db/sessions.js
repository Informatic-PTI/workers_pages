import { addDays } from "../lib/ids.js";
import { newSessionId } from "../lib/token.js";

export async function createSession(env, userId, meta, ttlDays = null) {
	const id = newSessionId();
	const expiresAt = addDays(Number(ttlDays || env.REFRESH_TOKEN_TTL_DAYS || 30));
	await env.AUTH_DB.prepare(
		`INSERT INTO sessions (id,user_id,status,ip_hash,user_agent_hash,last_seen_at,expires_at)
		 VALUES (?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, ?)`,
	).bind(id, userId, meta.ip_hash, meta.user_agent_hash, expiresAt).run();
	return { id, expires_at: expiresAt };
}

export async function getSession(env, id) {
	return env.AUTH_DB.prepare("SELECT * FROM sessions WHERE id = ?").bind(id).first();
}

export async function listSessionsForUser(env, userId) {
	return env.AUTH_DB.prepare(
		"SELECT id,status,created_at,last_seen_at,expires_at,revoked_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
	).bind(userId).all();
}

export async function touchSession(env, id) {
	await env.AUTH_DB.prepare("UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'").bind(id).run();
}

export async function revokeSession(env, id) {
	await env.AUTH_DB.prepare(
		"UPDATE sessions SET status = 'revoked', revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE id = ?",
	).bind(id).run();
}

export async function revokeUserSessions(env, userId) {
	await env.AUTH_DB.prepare(
		"UPDATE sessions SET status = 'revoked', revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE user_id = ? AND status = 'active'",
	).bind(userId).run();
}

export async function expireOldSessions(env) {
	return env.AUTH_DB.prepare(
		"UPDATE sessions SET status = 'expired' WHERE status = 'active' AND expires_at <= CURRENT_TIMESTAMP",
	).run();
}
