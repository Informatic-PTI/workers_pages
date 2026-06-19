import { insertAuditEvent } from "../db/auditEvents.js";
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
		} catch (error) {
			await insertAuditEvent(env, {
				event_type: body.type === "otp_delivery" ? "gowa_otp_send_failed" : "queue_message_failed",
				severity: "error",
				outcome: "failure",
				request_id: body.request_id,
				reason_code: error.message,
				target_type: body.challenge_id ? "otp_challenge" : null,
				target_id: body.challenge_id || null,
			});
			throw error;
		}
	}
}
