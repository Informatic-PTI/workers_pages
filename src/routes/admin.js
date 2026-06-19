import { grantPermission, revokePermission } from "../db/permissions.js";
import { createPasswordCredential } from "../db/credentials.js";
import { revokeRefreshTokenFamily, revokeRefreshTokensBySession, revokeRefreshTokensByUser } from "../db/refreshTokens.js";
import { revokeSession, revokeUserSessions } from "../db/sessions.js";
import { getUser, listUsers, updateUserStatus, createUser, userConflict } from "../db/users.js";
import { listSettings, setSettings, upsertUserAuthSettings } from "../db/settings.js";
import { auditEvent } from "../lib/audit.js";
import { createSnapshot, exportAudit } from "../lib/backup.js";
import { cacheDelete } from "../lib/cache.js";
import { checkGowaHealth } from "../lib/gowa.js";
import { readRateLimitState, requireAuth, resetRateLimit } from "../lib/guard.js";
import { generateUserId } from "../lib/ids.js";
import { hashPassword } from "../lib/password.js";
import { normalizeEmail, normalizePhone, maskPhone, maskEmail } from "../lib/phone.js";
import { isAdminRequest } from "../lib/request.js";
import { fail, httpError, ok, readJson } from "../lib/response.js";
import { seedInitial } from "../lib/seed.js";

function assertAdmin(request, env, request_id) {
	if (!isAdminRequest(request, env)) throw httpError("forbidden", "Forbidden", 403, request_id);
}

async function assertHyperuser(request, env, request_id) {
	const context = await requireAuth(request, env, request_id);
	if (!context.user?.is_hyperuser) throw httpError("forbidden", "Hyperuser required", 403, request_id);
	return context;
}

function limitParam(request, fallback = 100, max = 500) {
	const value = Number(new URL(request.url).searchParams.get("limit") || fallback);
	return Math.min(Math.max(Number.isFinite(value) ? Math.floor(value) : fallback, 1), max);
}

function redactHash(value) {
	return value ? `${String(value).slice(0, 12)}...` : null;
}

function parseJson(value, fallback = null) {
	try {
		return value ? JSON.parse(value) : fallback;
	} catch {
		return fallback;
	}
}

function redactOtpMetadata(row) {
	const metadata = parseJson(row.metadata_json, null);
	if (!metadata) return null;
	return {
		id_prefix: metadata.id_prefix || null,
		email: metadata.email ? maskEmail(metadata.email) : null,
		phone: metadata.phone ? maskPhone(metadata.phone) : null,
		username: metadata.username || null,
		display_name: metadata.display_name || null,
		password_hash_present: Boolean(metadata.password_hash),
	};
}

async function tableCount(env, table) {
	const row = await env.AUTH_DB.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first();
	return Number(row?.count || 0);
}

async function dashboardSummary(env) {
	const tables = ["users", "sessions", "refresh_tokens", "otp_challenges", "permissions", "roles", "services", "audit_events"];
	const counts = {};
	await Promise.all(tables.map(async (table) => {
		counts[table] = await tableCount(env, table);
	}));
	const recentAudit = await env.AUTH_DB.prepare(
		"SELECT id,event_type,severity,user_id,target_type,target_id,outcome,reason_code,created_at FROM audit_events ORDER BY created_at DESC LIMIT 8",
	).all();
	const activeSessions = await env.AUTH_DB.prepare("SELECT COUNT(*) AS count FROM sessions WHERE status = 'active'").first();
	const activeOtp = await env.AUTH_DB.prepare(
		"SELECT COUNT(*) AS count FROM otp_challenges WHERE used_at IS NULL AND expires_at > CURRENT_TIMESTAMP",
	).first();
	return {
		counts,
		active_sessions: Number(activeSessions?.count || 0),
		active_otp_challenges: Number(activeOtp?.count || 0),
		recent_audit: recentAudit.results || [],
		bindings: {
			auth_db: Boolean(env.AUTH_DB),
			auth_cache: Boolean(env.AUTH_CACHE),
			auth_backup_bucket: Boolean(env.AUTH_BACKUP_BUCKET),
			otp_queue: Boolean(env.OTP_QUEUE),
			audit_queue: Boolean(env.AUDIT_QUEUE),
			backup_queue: Boolean(env.BACKUP_QUEUE),
			rate_limiter_do: Boolean(env.AUTH_RATE_LIMITER),
			session_guard_do: Boolean(env.AUTH_SESSION_GUARD),
			gowa_vpc: Boolean(env.GOWA_VPC),
		},
	};
}

async function listDashboardUsers(request, env) {
	const url = new URL(request.url);
	const q = String(url.searchParams.get("q") || "").trim();
	const limit = limitParam(request, 100, 500);
	if (!q) {
		return (await env.AUTH_DB.prepare(
			`SELECT u.id,u.email,u.phone,u.username,u.display_name,u.status,u.is_hyperuser,u.created_at,u.updated_at,
			 uas.refresh_token_ttl_days, uas.access_token_ttl_seconds, COALESCE(uas.skip_otp, 0) AS skip_otp
			 FROM users u
			 LEFT JOIN user_auth_settings uas ON uas.user_id = u.id
			 ORDER BY u.created_at DESC
			 LIMIT ?`,
		).bind(limit).all()).results || [];
	}
	const like = `%${q}%`;
	return (await env.AUTH_DB.prepare(
		`SELECT u.id,u.email,u.phone,u.username,u.display_name,u.status,u.is_hyperuser,u.created_at,u.updated_at,
		 uas.refresh_token_ttl_days, uas.access_token_ttl_seconds, COALESCE(uas.skip_otp, 0) AS skip_otp
		 FROM users u
		 LEFT JOIN user_auth_settings uas ON uas.user_id = u.id
		 WHERE u.id LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.username LIKE ? OR u.display_name LIKE ?
		 ORDER BY u.created_at DESC
		 LIMIT ?`,
	).bind(like, like, like, like, like, limit).all()).results || [];
}

async function getUserDashboard(env, userId) {
	const user = await env.AUTH_DB.prepare(
		`SELECT u.*, uas.refresh_token_ttl_days, uas.access_token_ttl_seconds, COALESCE(uas.skip_otp, 0) AS skip_otp, uas.notes AS auth_notes
		 FROM users u
		 LEFT JOIN user_auth_settings uas ON uas.user_id = u.id
		 WHERE u.id = ?`,
	).bind(userId).first();
	if (!user) return null;
	const [credentials, sessions, refreshTokens, permissions, roles, audit] = await Promise.all([
		env.AUTH_DB.prepare(
			"SELECT id,type,hash_algorithm,iterations,enabled,created_at,updated_at,substr(secret_hash,1,12) AS hash_prefix FROM credentials WHERE user_id = ? ORDER BY created_at DESC",
		).bind(userId).all(),
		env.AUTH_DB.prepare(
			"SELECT id,status,ip_hash,user_agent_hash,created_at,last_seen_at,expires_at,revoked_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
		).bind(userId).all(),
		env.AUTH_DB.prepare(
			`SELECT id,session_id,family_id,rotated_from,expires_at,used_at,revoked_at,created_at,
			 substr(token_hash,1,12) AS token_hash_prefix
			 FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
		).bind(userId).all(),
		env.AUTH_DB.prepare(
			`SELECT p.permission_key,p.service_key,p.description,up.effect
			 FROM user_permissions up
			 JOIN permissions p ON p.id = up.permission_id
			 WHERE up.user_id = ?
			 ORDER BY p.service_key,p.permission_key`,
		).bind(userId).all(),
		env.AUTH_DB.prepare(
			`SELECT r.role_key,r.name,r.is_system
			 FROM user_roles ur
			 JOIN roles r ON r.id = ur.role_id
			 WHERE ur.user_id = ?
			 ORDER BY r.role_key`,
		).bind(userId).all(),
		env.AUTH_DB.prepare(
			"SELECT id,event_type,severity,target_type,target_id,outcome,reason_code,created_at FROM audit_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
		).bind(userId).all(),
	]);
	return {
		user,
		credentials: (credentials.results || []).map((row) => ({ ...row, secret_hash: redactHash(row.hash_prefix), hash_prefix: undefined })),
		sessions: sessions.results || [],
		refresh_tokens: (refreshTokens.results || []).map((row) => ({ ...row, token_hash: redactHash(row.token_hash_prefix), token_hash_prefix: undefined })),
		permissions: permissions.results || [],
		roles: roles.results || [],
		audit: audit.results || [],
	};
}

async function createDashboardUser(request, env, request_id) {
	const body = await readJson(request, request_id);
	const email = body.email ? normalizeEmail(body.email) : null;
	const phone = body.phone ? normalizePhone(body.phone) : null;
	const username = body.username ? String(body.username).trim() : null;
	const password = body.password == null ? "" : String(body.password);
	if (!email && !phone && !username) throw httpError("validation_error", "email, phone, or username is required", 400, request_id);
	if (password && password.length < 8) throw httpError("validation_error", "Password must be at least 8 characters", 400, request_id);
	if (await userConflict(env, { email, phone, username })) throw httpError("conflict", "User already exists", 409, request_id);
	const id = body.id ? String(body.id).trim().slice(0, 32) : await generateUserId(env, body.id_prefix || "US");
	const user = await createUser(env, {
		id,
		email,
		phone,
		username,
		display_name: body.display_name ? String(body.display_name).trim() : null,
		status: ["active", "blocked", "disabled"].includes(body.status) ? body.status : "active",
		is_hyperuser: Boolean(body.is_hyperuser),
	});
	if (password) await createPasswordCredential(env, user.id, await hashPassword(env, password));
	if (body.settings) await upsertUserAuthSettings(env, user.id, body.settings);
	return getUserDashboard(env, user.id);
}

async function updateDashboardUser(request, env, request_id, userId) {
	const body = await readJson(request, request_id);
	const fields = [];
	const values = [];
	if ("email" in body) {
		fields.push("email = ?");
		values.push(body.email ? normalizeEmail(body.email) : null);
	}
	if ("phone" in body) {
		fields.push("phone = ?");
		values.push(body.phone ? normalizePhone(body.phone) : null);
	}
	if ("username" in body) {
		fields.push("username = ?");
		values.push(body.username ? String(body.username).trim() : null);
	}
	if ("display_name" in body) {
		fields.push("display_name = ?");
		values.push(body.display_name ? String(body.display_name).trim() : null);
	}
	if ("status" in body) {
		if (!["active", "blocked", "disabled"].includes(body.status)) throw httpError("validation_error", "Invalid status", 400, request_id);
		fields.push("status = ?");
		values.push(body.status);
	}
	if ("is_hyperuser" in body) {
		fields.push("is_hyperuser = ?");
		values.push(body.is_hyperuser ? 1 : 0);
	}
	if (fields.length) {
		await env.AUTH_DB.prepare(`UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values, userId).run();
		await cacheDelete(env, `user_status:${userId}`);
		await cacheDelete(env, `perm:${userId}`);
	}
	if (body.settings) await upsertUserAuthSettings(env, userId, body.settings);
	return getUserDashboard(env, userId);
}

async function listKvKeys(request, env) {
	if (!env.AUTH_CACHE) return { available: false, keys: [] };
	const url = new URL(request.url);
	const prefix = String(url.searchParams.get("prefix") || "").slice(0, 128);
	const limit = limitParam(request, 50, 100);
	const listed = await env.AUTH_CACHE.list({ prefix, limit, cursor: url.searchParams.get("cursor") || undefined });
	const keys = listed.keys || [];
	const includeValues = url.searchParams.get("include_values") === "true";
	const withValues = [];
	for (const key of keys.slice(0, includeValues ? 25 : keys.length)) {
		const item = { name: key.name, expiration: key.expiration || null, metadata: key.metadata || null };
		if (includeValues) {
			const value = await env.AUTH_CACHE.get(key.name);
			item.value_preview = key.name.startsWith("sess:")
				? "[redacted session cache]"
				: String(value || "").slice(0, 500);
		}
		withValues.push(item);
	}
	return { available: true, keys: includeValues ? withValues : keys, cursor: listed.cursor || null, list_complete: Boolean(listed.list_complete) };
}

async function infraSummary(env) {
	let r2 = { available: false };
	if (env.AUTH_BACKUP_BUCKET) {
		const listed = await env.AUTH_BACKUP_BUCKET.list({ limit: 20 });
		r2 = { available: true, objects: (listed.objects || []).map((item) => ({ key: item.key, size: item.size, uploaded: item.uploaded })) };
	}
	return {
		...(await dashboardSummary(env)),
		r2,
		gowa: await checkGowaHealth(env),
		settings: await listSettings(env),
	};
}

async function handleDashboardAdmin(request, env, ctx, request_id, parts) {
	const context = await assertHyperuser(request, env, request_id);
	const method = request.method;
	const section = parts[2] || "summary";

	if (method === "GET" && (section === "bootstrap" || section === "summary")) {
		return ok({ actor: context.user, dashboard: await dashboardSummary(env) }, request_id);
	}
	if (method === "GET" && section === "infra") return ok({ infra: await infraSummary(env) }, request_id);
	if (method === "GET" && section === "settings") return ok({ settings: await listSettings(env) }, request_id);
	if (method === "PUT" && section === "settings") {
		const body = await readJson(request, request_id);
		const updated = await setSettings(env, body.settings || body);
		await auditEvent(env, { event_type: "dashboard_settings_updated", outcome: "success", request_id, user_id: context.user.id, metadata: { updated } });
		return ok({ updated, settings: await listSettings(env) }, request_id);
	}
	if (method === "GET" && section === "users" && !parts[3]) return ok({ users: await listDashboardUsers(request, env) }, request_id);
	if (method === "POST" && section === "users" && !parts[3]) {
		const user = await createDashboardUser(request, env, request_id);
		await auditEvent(env, { event_type: "dashboard_user_created", outcome: "success", request_id, user_id: context.user.id, target_type: "user", target_id: user.user.id });
		return ok(user, request_id, 201);
	}
	if (method === "GET" && section === "users" && parts[3]) {
		const user = await getUserDashboard(env, parts[3]);
		if (!user) throw httpError("not_found", "Not found", 404, request_id);
		return ok(user, request_id);
	}
	if (method === "PATCH" && section === "users" && parts[3]) {
		const user = await updateDashboardUser(request, env, request_id, parts[3]);
		if (!user) throw httpError("not_found", "Not found", 404, request_id);
		await auditEvent(env, { event_type: "dashboard_user_updated", outcome: "success", request_id, user_id: context.user.id, target_type: "user", target_id: parts[3] });
		return ok(user, request_id);
	}
	if (method === "POST" && section === "users" && parts[3] && parts[4] === "password") {
		const body = await readJson(request, request_id);
		const password = String(body.password || "");
		if (password.length < 8) throw httpError("validation_error", "Password must be at least 8 characters", 400, request_id);
		await env.AUTH_DB.prepare("UPDATE credentials SET enabled = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND type = 'password'").bind(parts[3]).run();
		await createPasswordCredential(env, parts[3], await hashPassword(env, password));
		await auditEvent(env, { event_type: "dashboard_password_reset", outcome: "success", request_id, user_id: context.user.id, target_type: "user", target_id: parts[3] });
		return ok({ reset: true }, request_id);
	}
	if (method === "POST" && section === "users" && parts[3] && parts[4] === "sessions" && parts[5] === "revoke-all") {
		await revokeUserSessions(env, parts[3]);
		await revokeRefreshTokensByUser(env, parts[3]);
		await cacheDelete(env, `perm:${parts[3]}`);
		await auditEvent(env, { event_type: "dashboard_user_sessions_revoked", outcome: "success", request_id, user_id: context.user.id, target_type: "user", target_id: parts[3] });
		return ok({ revoked: true }, request_id);
	}
	if (method === "DELETE" && section === "sessions" && parts[3]) {
		await revokeSession(env, parts[3]);
		await revokeRefreshTokensBySession(env, parts[3]);
		await cacheDelete(env, `sess:${parts[3]}`);
		await auditEvent(env, { event_type: "dashboard_session_revoked", outcome: "success", request_id, user_id: context.user.id, target_type: "session", target_id: parts[3] });
		return ok({ revoked: true }, request_id);
	}
	if (method === "DELETE" && section === "refresh-tokens" && parts[3]) {
		await env.AUTH_DB.prepare("UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, CURRENT_TIMESTAMP) WHERE id = ?").bind(parts[3]).run();
		await auditEvent(env, { event_type: "dashboard_refresh_token_revoked", outcome: "success", request_id, user_id: context.user.id, target_type: "refresh_token", target_id: parts[3] });
		return ok({ revoked: true }, request_id);
	}
	if (method === "DELETE" && section === "refresh-token-families" && parts[3]) {
		await revokeRefreshTokenFamily(env, decodeURIComponent(parts[3]));
		await auditEvent(env, { event_type: "dashboard_refresh_family_revoked", outcome: "success", request_id, user_id: context.user.id, target_type: "refresh_family", target_id: decodeURIComponent(parts[3]) });
		return ok({ revoked: true }, request_id);
	}
	if (method === "GET" && section === "audit") {
		const rows = await env.AUTH_DB.prepare(
			"SELECT id,event_type,severity,service_key,user_id,session_id,target_type,target_id,outcome,reason_code,metadata_json,created_at FROM audit_events ORDER BY created_at DESC LIMIT ?",
		).bind(limitParam(request, 100, 500)).all();
		return ok({ audit: (rows.results || []).map((row) => ({ ...row, metadata: parseJson(row.metadata_json, null), metadata_json: undefined })) }, request_id);
	}
	if (method === "GET" && section === "otp") {
		const rows = await env.AUTH_DB.prepare(
			`SELECT id,phone,user_id,purpose,attempt_count,max_attempts,expires_at,used_at,created_at,metadata_json,substr(otp_hash,1,12) AS otp_hash_prefix
			 FROM otp_challenges ORDER BY created_at DESC LIMIT ?`,
		).bind(limitParam(request, 100, 500)).all();
		return ok({
			challenges: (rows.results || []).map((row) => ({
				id: row.id,
				phone: maskPhone(row.phone),
				user_id: row.user_id,
				purpose: row.purpose,
				attempt_count: row.attempt_count,
				max_attempts: row.max_attempts,
				expires_at: row.expires_at,
				used_at: row.used_at,
				created_at: row.created_at,
				otp_hash: redactHash(row.otp_hash_prefix),
				metadata: redactOtpMetadata(row),
			})),
		}, request_id);
	}
	if (method === "POST" && section === "otp" && parts[3] && parts[4] === "expire") {
		await env.AUTH_DB.prepare("UPDATE otp_challenges SET used_at = COALESCE(used_at, CURRENT_TIMESTAMP) WHERE id = ?").bind(parts[3]).run();
		await auditEvent(env, { event_type: "dashboard_otp_expired", outcome: "success", request_id, user_id: context.user.id, target_type: "otp_challenge", target_id: parts[3] });
		return ok({ expired: true }, request_id);
	}
	if (method === "GET" && section === "kv") return ok({ kv: await listKvKeys(request, env) }, request_id);
	if (method === "POST" && section === "durable" && parts[3] === "rate-limit-state") {
		const body = await readJson(request, request_id);
		const key = String(body.key || "").slice(0, 300);
		if (!key || !env.AUTH_RATE_LIMITER) return ok({ available: Boolean(env.AUTH_RATE_LIMITER), state: null }, request_id);
		return ok({ durable: await readRateLimitState(env, key) }, request_id);
	}
	if (method === "POST" && section === "durable" && parts[3] === "rate-limit-reset") {
		const body = await readJson(request, request_id);
		const key = String(body.key || "").slice(0, 300);
		if (!key) return fail("missing_key", "Missing key", request_id, 400);
		return ok({ durable: await resetRateLimit(env, key) }, request_id);
	}

	throw httpError("not_found", "Not found", 404, request_id);
}

export async function handleAdmin(request, env, ctx, request_id, parts) {
	if (parts[1] === "dashboard") return handleDashboardAdmin(request, env, ctx, request_id, parts);
	assertAdmin(request, env, request_id);
	const method = request.method;
	const leaf = parts.slice(1).join("/");

	if (method === "GET" && leaf === "users") {
		const rows = await listUsers(env, new URL(request.url).searchParams.get("limit") || 100);
		return ok({ users: rows.results || [] }, request_id);
	}

	if (method === "GET" && parts[1] === "users" && parts[2]) {
		const user = await getUser(env, parts[2]);
		if (!user) throw httpError("not_found", "Not found", 404, request_id);
		return ok({ user }, request_id);
	}

	if (method === "PATCH" && parts[1] === "users" && parts[2] && parts[3] === "status") {
		const body = await readJson(request, request_id);
		if (!["active", "blocked", "disabled"].includes(body.status)) throw httpError("validation_error", "Invalid status", 400, request_id);
		const user = await updateUserStatus(env, parts[2], body.status);
		await cacheDelete(env, `user_status:${parts[2]}`);
		await cacheDelete(env, `perm:${parts[2]}`);
		await auditEvent(env, { event_type: "user_status_changed", outcome: "success", request_id, target_type: "user", target_id: parts[2], metadata: { status: body.status } });
		return ok({ user }, request_id);
	}

	if (method === "POST" && parts[1] === "users" && parts[2] && parts[3] === "permissions") {
		const body = await readJson(request, request_id);
		if (!body.permission_key) throw httpError("validation_error", "permission_key is required", 400, request_id);
		await grantPermission(env, parts[2], body.permission_key, body.service_key || env.AUTH_SERVICE_KEY || "irwanmotor-auth", body.description || null);
		await auditEvent(env, { event_type: "permission_granted", outcome: "success", request_id, target_type: "user", target_id: parts[2], reason_code: body.permission_key });
		return ok({ granted: true }, request_id);
	}

	if (method === "DELETE" && parts[1] === "users" && parts[2] && parts[3] === "permissions" && parts[4]) {
		await revokePermission(env, parts[2], decodeURIComponent(parts[4]));
		await auditEvent(env, { event_type: "permission_revoked", outcome: "success", request_id, target_type: "user", target_id: parts[2], reason_code: decodeURIComponent(parts[4]) });
		return ok({ revoked: true }, request_id);
	}

	if (method === "GET" && leaf === "gowa/health") {
		const health = await checkGowaHealth(env);
		return health.ok ? ok(health, request_id) : fail("gowa_unreachable", "GoWA unreachable", request_id, 502, health);
	}

	if (method === "POST" && leaf === "seed/initial") {
		if (String(env.ENABLE_ADMIN_SEED || "false") !== "true") {
			throw httpError("forbidden", "Admin seed is disabled", 403, request_id);
		}
		const seeded = await seedInitial(env);
		await auditEvent(env, { event_type: "seed_initial_completed", outcome: "success", request_id });
		return ok({ seeded }, request_id);
	}

	if (method === "POST" && leaf === "backup/snapshot") {
		const result = await createSnapshot(env);
		await auditEvent(env, { event_type: "backup_snapshot_created", outcome: "success", request_id, metadata: { key: result.key } });
		return ok({ key: result.key, snapshot: result.snapshot }, request_id);
	}

	if (method === "POST" && leaf === "backup/audit-export") {
		const result = await exportAudit(env);
		return ok(result, request_id);
	}

	if (method === "POST" && leaf === "ratelimit/reset") {
		if (!isAdminRequest(request, env)) throw httpError("forbidden", "Forbidden", 403, request_id);
		const body = await readJson(request, request_id);
		const key = String(body.key || "").trim();
		if (!key) return fail("missing_key", "Missing key", request_id, 400);
		return ok(await resetRateLimit(env, key), request_id);
	}

	if (method === "POST" && leaf === "ratelimit/state") {
		if (!isAdminRequest(request, env)) throw httpError("forbidden", "Forbidden", 403, request_id);
		const body = await readJson(request, request_id);
		const key = String(body.key || "").trim();
		if (!key) return fail("missing_key", "Missing key", request_id, 400);
		return ok(await readRateLimitState(env, key), request_id);
	}

	throw httpError("not_found", "Not found", 404, request_id);
}
