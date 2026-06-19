import { randomId } from "../lib/crypto.js";
import { cacheDelete, cacheGetJson, cachePutJson } from "../lib/cache.js";
import { getNumberSetting } from "./settings.js";

export async function permissionsForUser(env, userId, isHyperuser = false) {
	if (isHyperuser) return ["*"];
	const key = `perm:${userId}`;
	const cached = await cacheGetJson(env, key);
	if (cached) return cached.permissions;
	const result = await env.AUTH_DB.prepare(
		`SELECT DISTINCT p.permission_key
		 FROM permissions p
		 LEFT JOIN role_permissions rp ON rp.permission_id = p.id
		 LEFT JOIN user_roles ur ON ur.role_id = rp.role_id
		 LEFT JOIN user_permissions up ON up.permission_id = p.id AND up.user_id = ?
		 WHERE ur.user_id = ? OR (up.user_id = ? AND up.effect = 'allow')`,
	).bind(userId, userId, userId).all();
	const permissions = (result.results || []).map((row) => row.permission_key);
	await cachePutJson(env, key, { permissions }, await getNumberSetting(env, "permission_cache_ttl_seconds"));
	return permissions;
}

export async function hasPermission(env, user, permission) {
	if (user.is_hyperuser) return true;
	const permissions = await permissionsForUser(env, user.id, false);
	return permissions.includes(permission) || permissions.includes("*");
}

export async function grantPermission(env, userId, permissionKey, serviceKey = "profile", description = null) {
	let permission = await env.AUTH_DB.prepare("SELECT * FROM permissions WHERE permission_key = ?").bind(permissionKey).first();
	if (!permission) {
		const id = randomId("perm", 12);
		await env.AUTH_DB.prepare(
			"INSERT INTO permissions (id,permission_key,service_key,description) VALUES (?, ?, ?, ?)",
		).bind(id, permissionKey, serviceKey, description).run();
		permission = { id };
	}
	await env.AUTH_DB.prepare(
		"INSERT OR IGNORE INTO user_permissions (user_id,permission_id,effect) VALUES (?, ?, 'allow')",
	).bind(userId, permission.id).run();
	await cacheDelete(env, `perm:${userId}`);
}

export async function revokePermission(env, userId, permissionKey) {
	const permission = await env.AUTH_DB.prepare("SELECT id FROM permissions WHERE permission_key = ?").bind(permissionKey).first();
	if (permission) {
		await env.AUTH_DB.prepare("DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?").bind(userId, permission.id).run();
	}
	await cacheDelete(env, `perm:${userId}`);
}
