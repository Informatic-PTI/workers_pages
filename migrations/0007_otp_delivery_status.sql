ALTER TABLE otp_challenges ADD COLUMN delivery_status TEXT NOT NULL DEFAULT 'pending'
	CHECK (delivery_status IN ('pending', 'queued', 'sending', 'sent', 'retrying', 'failed'));
ALTER TABLE otp_challenges ADD COLUMN delivery_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE otp_challenges ADD COLUMN queued_at TEXT;
ALTER TABLE otp_challenges ADD COLUMN sent_at TEXT;
ALTER TABLE otp_challenges ADD COLUMN last_delivery_at TEXT;
ALTER TABLE otp_challenges ADD COLUMN delivery_error TEXT;

CREATE INDEX IF NOT EXISTS idx_otp_delivery_status_created
	ON otp_challenges(delivery_status, created_at);
