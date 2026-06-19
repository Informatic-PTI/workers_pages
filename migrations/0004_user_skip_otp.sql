PRAGMA foreign_keys = ON;

ALTER TABLE user_auth_settings ADD COLUMN skip_otp INTEGER NOT NULL DEFAULT 0;

