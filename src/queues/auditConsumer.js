import { insertAuditEvent } from "../db/auditEvents.js";

export async function processAuditMessage(env, body) {
	if (body.type === "audit_event") await insertAuditEvent(env, body.event);
}
