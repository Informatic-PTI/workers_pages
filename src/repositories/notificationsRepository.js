import { appDb } from "../lib/bindings.js";

export async function listNotifications(env, { userId, roles, unreadOnly = false, limit, offset }) {
	const rolePlaceholders = roles.length ? roles.map(() => "?").join(",") : "''";
	const unread = unreadOnly ? "AND n.read_at IS NULL" : "";
	const db = appDb(env);
	const values = [userId, ...roles];
	const where = `(n.user_id = ? OR (n.user_id IS NULL AND n.role_key IN (${rolePlaceholders}))) ${unread}`;
	const [rows, count] = await Promise.all([
		db.prepare(`SELECT n.* FROM notifications n WHERE ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`).bind(...values, limit, offset).all(),
		db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN n.read_at IS NULL THEN 1 ELSE 0 END) AS unread FROM notifications n WHERE ${where}`).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0), unread: Number(count?.unread || 0) };
}

export async function markNotificationRead(env, id, userId, roles) {
	const rolePlaceholders = roles.length ? roles.map(() => "?").join(",") : "''";
	const db = appDb(env);
	await db.prepare(
		`UPDATE notifications SET read_at=COALESCE(read_at,CURRENT_TIMESTAMP)
		 WHERE id=? AND (user_id=? OR (user_id IS NULL AND role_key IN (${rolePlaceholders})))`,
	).bind(id, userId, ...roles).run();
	return db.prepare(
		`SELECT * FROM notifications
		 WHERE id=? AND (user_id=? OR (user_id IS NULL AND role_key IN (${rolePlaceholders})))`,
	).bind(id, userId, ...roles).first();
}

export async function markAllNotificationsRead(env, userId, roles) {
	const rolePlaceholders = roles.length ? roles.map(() => "?").join(",") : "''";
	return appDb(env).prepare(
		`UPDATE notifications SET read_at=COALESCE(read_at,CURRENT_TIMESTAMP)
		 WHERE read_at IS NULL AND (user_id=? OR (user_id IS NULL AND role_key IN (${rolePlaceholders})))`,
	).bind(userId, ...roles).run();
}
