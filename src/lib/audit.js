import { insertAuditEvent } from "../db/auditEvents.js";

const CRITICAL = new Set([
	"login_password_failed",
	"login_password_success",
	"refresh_reuse_detected",
	"permission_denied",
	"user_status_changed",
	"admin_action_denied",
	"logout",
	"logout_all",
]);

function sanitize(event) {
	const copy = { ...event };
	if (copy.metadata) {
		const metadata = { ...copy.metadata };
		for (const key of ["password", "otp", "access_token", "refresh_token", "authorization", "jwt_secret"]) delete metadata[key];
		copy.metadata = metadata;
	}
	return copy;
}

export async function auditEvent(env, event) {
	const sanitized = sanitize(event);
	if (CRITICAL.has(sanitized.event_type) || !env.AUDIT_QUEUE) {
		await insertAuditEvent(env, sanitized);
		return;
	}
	await env.AUDIT_QUEUE.send({ type: "audit_event", event: sanitized });
}
