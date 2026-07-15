import { auditEvent } from "./audit.js";

export async function domainAudit(env, event) {
	try {
		await auditEvent(env, {
			service_key: "irwanmotor-app",
			outcome: "success",
			severity: "info",
			...event,
		});
	} catch {
		console.warn(JSON.stringify({
			event: "domain_audit_failed",
			request_id: event.request_id || null,
			audit_event_type: event.event_type,
		}));
	}
}
