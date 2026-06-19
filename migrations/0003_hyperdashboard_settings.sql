PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_settings (
	key TEXT PRIMARY KEY,
	value TEXT NOT NULL,
	value_type TEXT NOT NULL DEFAULT 'string',
	description TEXT,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_auth_settings (
	user_id TEXT PRIMARY KEY,
	refresh_token_ttl_days INTEGER,
	access_token_ttl_seconds INTEGER,
	notes TEXT,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO auth_settings (key, value, value_type, description) VALUES
	('access_token_ttl_seconds', '900', 'number', 'Default access token lifetime in seconds.'),
	('refresh_token_ttl_days', '30', 'number', 'Default refresh token and session lifetime in days.'),
	('otp_ttl_seconds', '300', 'number', 'Default OTP challenge lifetime in seconds.'),
	('otp_max_attempts', '5', 'number', 'Maximum OTP verification attempts.'),
	('otp_resend_cooldown_seconds', '60', 'number', 'Minimum seconds between OTP sends for the same phone.'),
	('permission_cache_ttl_seconds', '120', 'number', 'Permission cache lifetime in KV.'),
	('session_cache_ttl_seconds', '60', 'number', 'Session cache lifetime in KV.'),
	('otp_message_template', 'Kode OTP Irwan Motor Anda: {{otp}}. Berlaku {{ttl_minutes}} menit. Jangan berikan kode ini kepada siapa pun.', 'string', 'WhatsApp OTP message template. Supported placeholders: {{otp}}, {{ttl_minutes}}, {{purpose}}.');

CREATE INDEX IF NOT EXISTS idx_user_auth_settings_refresh_ttl
ON user_auth_settings(refresh_token_ttl_days);
