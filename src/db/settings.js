const NUMBER_SETTINGS = new Set([
	"access_token_ttl_seconds",
	"refresh_token_ttl_days",
	"otp_ttl_seconds",
	"otp_max_attempts",
	"otp_resend_cooldown_seconds",
	"permission_cache_ttl_seconds",
	"session_cache_ttl_seconds",
]);

const STRING_SETTINGS = new Set(["otp_message_template"]);

const DEFAULTS = {
	access_token_ttl_seconds: 900,
	refresh_token_ttl_days: 30,
	otp_ttl_seconds: 300,
	otp_max_attempts: 5,
	otp_resend_cooldown_seconds: 60,
	permission_cache_ttl_seconds: 120,
	session_cache_ttl_seconds: 60,
	otp_message_template: "Kode OTP Irwan Motor Anda: {{otp}}. Berlaku {{ttl_minutes}} menit. Jangan berikan kode ini kepada siapa pun.",
};

export function allowedSettingKeys() {
	return [...NUMBER_SETTINGS, ...STRING_SETTINGS];
}

function envFallback(env, key) {
	const envKey = key.toUpperCase();
	return env[envKey] ?? DEFAULTS[key];
}

function clampNumber(key, value) {
	const number = Math.floor(Number(value));
	if (!Number.isFinite(number)) throw new Error(`invalid_setting_${key}`);
	const limits = {
		access_token_ttl_seconds: [60, 86400],
		refresh_token_ttl_days: [1, 365],
		otp_ttl_seconds: [60, 1800],
		otp_max_attempts: [1, 20],
		otp_resend_cooldown_seconds: [10, 3600],
		permission_cache_ttl_seconds: [0, 86400],
		session_cache_ttl_seconds: [0, 86400],
	}[key];
	const [min, max] = limits || [0, Number.MAX_SAFE_INTEGER];
	return Math.min(Math.max(number, min), max);
}

export async function getSetting(env, key) {
	try {
		const row = await env.AUTH_DB.prepare("SELECT value FROM auth_settings WHERE key = ?").bind(key).first();
		return row?.value ?? String(envFallback(env, key) ?? "");
	} catch {
		return String(envFallback(env, key) ?? "");
	}
}

export async function getNumberSetting(env, key) {
	const value = await getSetting(env, key);
	return clampNumber(key, value || envFallback(env, key));
}

export async function listSettings(env) {
	let rows = [];
	try {
		const result = await env.AUTH_DB.prepare(
			"SELECT key, value, value_type, description, updated_at FROM auth_settings ORDER BY key",
		).all();
		rows = result.results || [];
	} catch {
		rows = [];
	}
	const seen = new Set(rows.map((row) => row.key));
	for (const key of allowedSettingKeys()) {
		if (!seen.has(key)) {
			rows.push({
				key,
				value: String(envFallback(env, key) ?? ""),
				value_type: NUMBER_SETTINGS.has(key) ? "number" : "string",
				description: "Runtime fallback from env/default.",
				updated_at: null,
			});
		}
	}
	return rows.sort((a, b) => a.key.localeCompare(b.key));
}

export async function setSettings(env, settings) {
	const updated = [];
	for (const [key, rawValue] of Object.entries(settings || {})) {
		if (!NUMBER_SETTINGS.has(key) && !STRING_SETTINGS.has(key)) continue;
		const value = NUMBER_SETTINGS.has(key) ? String(clampNumber(key, rawValue)) : String(rawValue ?? "").slice(0, 1000);
		await env.AUTH_DB.prepare(
			`INSERT INTO auth_settings (key, value, value_type, updated_at)
			 VALUES (?, ?, ?, CURRENT_TIMESTAMP)
			 ON CONFLICT(key) DO UPDATE SET value = excluded.value, value_type = excluded.value_type, updated_at = CURRENT_TIMESTAMP`,
		).bind(key, value, NUMBER_SETTINGS.has(key) ? "number" : "string").run();
		updated.push(key);
	}
	return updated;
}

export async function getUserAuthSettings(env, userId) {
	try {
		return await env.AUTH_DB.prepare("SELECT * FROM user_auth_settings WHERE user_id = ?").bind(userId).first();
	} catch {
		return null;
	}
}

export async function upsertUserAuthSettings(env, userId, settings) {
	const refresh = settings.refresh_token_ttl_days == null || settings.refresh_token_ttl_days === ""
		? null
		: clampNumber("refresh_token_ttl_days", settings.refresh_token_ttl_days);
	const access = settings.access_token_ttl_seconds == null || settings.access_token_ttl_seconds === ""
		? null
		: clampNumber("access_token_ttl_seconds", settings.access_token_ttl_seconds);
	const skipOtp = "skip_otp" in (settings || {}) ? parseBoolean(settings.skip_otp) : null;
	const notes = settings.notes == null ? null : String(settings.notes).slice(0, 500);
	await env.AUTH_DB.prepare(
		`INSERT INTO user_auth_settings (user_id, refresh_token_ttl_days, access_token_ttl_seconds, skip_otp, notes, updated_at)
		 VALUES (?, ?, ?, COALESCE(?, 0), ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(user_id) DO UPDATE SET
			refresh_token_ttl_days = excluded.refresh_token_ttl_days,
			access_token_ttl_seconds = excluded.access_token_ttl_seconds,
			skip_otp = CASE WHEN ? IS NULL THEN user_auth_settings.skip_otp ELSE excluded.skip_otp END,
			notes = excluded.notes,
			updated_at = CURRENT_TIMESTAMP`,
	).bind(userId, refresh, access, skipOtp, notes, skipOtp).run();
	return getUserAuthSettings(env, userId);
}

function parseBoolean(value) {
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "number") return value ? 1 : 0;
	const text = String(value ?? "").trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(text)) return 1;
	if (["0", "false", "no", "off", ""].includes(text)) return 0;
	return value ? 1 : 0;
}

export async function getUserRefreshTtlDays(env, userId) {
	const row = userId ? await getUserAuthSettings(env, userId) : null;
	if (row?.refresh_token_ttl_days) return clampNumber("refresh_token_ttl_days", row.refresh_token_ttl_days);
	return getNumberSetting(env, "refresh_token_ttl_days");
}

export async function getUserAccessTtlSeconds(env, userId) {
	const row = userId ? await getUserAuthSettings(env, userId) : null;
	if (row?.access_token_ttl_seconds) return clampNumber("access_token_ttl_seconds", row.access_token_ttl_seconds);
	return getNumberSetting(env, "access_token_ttl_seconds");
}

export async function getUserSkipOtp(env, userId) {
	const row = userId ? await getUserAuthSettings(env, userId) : null;
	return Boolean(row?.skip_otp);
}
