import { insertAuditEvent } from "../db/auditEvents.js";
import { markOtpDeliveryFailed } from "../db/otpChallenges.js";
import { processAuditMessage } from "./auditConsumer.js";
import { processBackupMessage } from "./backupConsumer.js";
import { processOtpMessage } from "./otpConsumer.js";

export async function handleQueue(batch, env, ctx) {
	for (const message of batch.messages) {
		const body = message.body || {};
		try {
			if (body.type === "otp_delivery") await processOtpMessage(env, body);
			else if (body.type === "audit_event") await processAuditMessage(env, body);
			else if (body.type === "backup_snapshot") await processBackupMessage(env, body);
			else throw new Error("unknown_queue_message_type");
			message.ack?.();
		} catch (error) {
			const attempts = Math.max(1, Number(message.attempts || 1));
			const willRetry = attempts < 5;
			if (body.type === "otp_delivery" && body.challenge_id) {
				try { await markOtpDeliveryFailed(env, body.challenge_id, error, willRetry); } catch { /* Retry policy still applies. */ }
			}
			try {
				await insertAuditEvent(env, {
					event_type: body.type === "otp_delivery" ? "gowa_otp_send_failed" : "queue_message_failed",
					severity: "error",
					outcome: "failure",
					request_id: body.request_id,
					reason_code: error.message,
					target_type: body.challenge_id ? "otp_challenge" : null,
					target_id: body.challenge_id || null,
				});
			} catch { /* Do not lose the message retry because audit storage is unavailable. */ }
			if (willRetry && message.retry) {
				message.retry({ delaySeconds: Math.min(300, 5 * (2 ** (attempts - 1))) });
			} else if (!willRetry && message.ack) {
				message.ack();
			} else {
				throw error;
			}
		}
	}
}
