import { insertAuditEvent } from "../db/auditEvents.js";
import { sendWhatsAppOtp } from "../lib/gowa.js";

export async function processOtpMessage(env, body) {
	await sendWhatsAppOtp(env, {
		phone: body.phone,
		otp: body.otp,
		purpose: body.purpose,
		requestId: body.request_id,
	});
	await insertAuditEvent(env, {
		event_type: "otp_delivery_success",
		outcome: "success",
		request_id: body.request_id,
		target_type: "otp_challenge",
		target_id: body.challenge_id,
	});
}
