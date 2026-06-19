import { normalizeEmail, normalizePhone } from "../lib/phone.js";

export async function findUserByIdentifier(env, identifier) {
	const raw = String(identifier || "").trim();
	if (!raw) return null;
	if (raw.includes("@")) {
		return env.AUTH_DB.prepare("SELECT * FROM users WHERE email = ?").bind(normalizeEmail(raw)).first();
	}
	const phone = normalizePhone(raw);
	if (phone) return env.AUTH_DB.prepare("SELECT * FROM users WHERE phone = ?").bind(phone).first();
	return env.AUTH_DB.prepare("SELECT * FROM users WHERE id = ? OR username = ?").bind(raw, raw).first();
}

export async function getUser(env, id) {
	return env.AUTH_DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
}

export async function listUsers(env, limit = 100) {
	return env.AUTH_DB.prepare(
		"SELECT id,email,phone,username,display_name,status,is_hyperuser,created_at,updated_at FROM users ORDER BY created_at DESC LIMIT ?",
	).bind(Math.min(Number(limit) || 100, 500)).all();
}

export async function createUser(env, user) {
	await env.AUTH_DB.prepare(
		`INSERT INTO users (id,email,phone,username,display_name,status,is_hyperuser)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
	).bind(
		user.id,
		user.email || null,
		user.phone || null,
		user.username || null,
		user.display_name || null,
		user.status || "active",
		user.is_hyperuser ? 1 : 0,
	).run();
	return getUser(env, user.id);
}

export async function updateUserStatus(env, id, status) {
	await env.AUTH_DB.prepare("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, id).run();
	return getUser(env, id);
}

export async function userConflict(env, { email, phone, username }) {
	const clauses = [];
	const values = [];
	if (email) { clauses.push("email = ?"); values.push(email); }
	if (phone) { clauses.push("phone = ?"); values.push(phone); }
	if (username) { clauses.push("username = ?"); values.push(username); }
	if (!clauses.length) return null;
	return env.AUTH_DB.prepare(`SELECT id,email,phone,username FROM users WHERE ${clauses.join(" OR ")} LIMIT 1`).bind(...values).first();
}
