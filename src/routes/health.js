import { ok } from "../lib/response.js";

export async function handleHealth(env, request_id) {
	const checks = { d1: false, kv: Boolean(env.AUTH_CACHE), r2: Boolean(env.AUTH_BACKUP_BUCKET), queues: Boolean(env.OTP_QUEUE && env.AUDIT_QUEUE) };
	try {
		await env.AUTH_DB.prepare("SELECT 1 AS ok").first();
		checks.d1 = true;
	} catch {
		checks.d1 = false;
	}
	return ok({ service: env.AUTH_SERVICE_KEY || "irwanmotor-auth", status: checks.d1 ? "ok" : "degraded", checks }, request_id);
}
