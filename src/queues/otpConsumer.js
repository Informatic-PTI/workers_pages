import { insertAuditEvent } from "../db/auditEvents.js";
import { getOtpChallenge, markOtpSending, markOtpSent } from "../db/otpChallenges.js";
import { sendWhatsAppOtp } from "../lib/gowa.js";

export async function processOtpMessage(env, body) {
	if (!body.challenge_id || !body.phone || !body.otp) throw new Error("invalid_otp_delivery_message");
	const challenge = await getOtpChallenge(env, body.challenge_id);
	if (!challenge || challenge.used_at || challenge.delivery_status === "sent" || new Date(challenge.expires_at).getTime() <= Date.now()) return;
	await markOtpSending(env, body.challenge_id);
	await sendWhatsAppOtp(env, {
		phone: body.phone,
		otp: body.otp,
		purpose: body.purpose,
		requestId: body.request_id,
	});
	try {
		await markOtpSent(env, body.challenge_id);
		await insertAuditEvent(env, {
			event_type: "otp_delivery_success",
			outcome: "success",
			request_id: body.request_id,
			target_type: "otp_challenge",
			target_id: body.challenge_id,
		});
	} catch {
		// GOWA already accepted the OTP; retrying here could send a duplicate message.
	}
}
