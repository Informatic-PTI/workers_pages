import { randomId } from "../lib/crypto.js";

export async function insertAuditEvent(env, event) {
	await env.AUTH_DB.prepare(
		`INSERT INTO audit_events (
		 id,event_type,severity,service_key,user_id,session_id,request_id,ip_hash,user_agent_hash,
		 target_type,target_id,outcome,reason_code,metadata_json
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	).bind(
		event.id || randomId("aud", 16),
		event.event_type,
		event.severity || "info",
		event.service_key || env.AUTH_SERVICE_KEY || "irwanmotor-auth",
		event.user_id || null,
		event.session_id || null,
		event.request_id || null,
		event.ip_hash || null,
		event.user_agent_hash || null,
		event.target_type || null,
		event.target_id || null,
		event.outcome || "unknown",
		event.reason_code || null,
		event.metadata ? JSON.stringify(event.metadata) : null,
	).run();
}
