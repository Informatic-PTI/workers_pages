import { randomId } from "./crypto.js";

async function count(env, table) {
	const row = await env.AUTH_DB.prepare(`SELECT COUNT(*) AS n FROM ${table}`).first();
	return row?.n || 0;
}

export async function createSnapshot(env, { includeSensitive = false } = {}) {
	const generatedAt = new Date().toISOString();
	const summary = {
		generated_at: generatedAt,
		service: env.AUTH_SERVICE_KEY || "irwanmotor-auth",
		version: "1.0.0",
		include_sensitive_hashes: Boolean(includeSensitive),
		counts: {
			users: await count(env, "users"),
			sessions: await count(env, "sessions"),
			refresh_tokens: await count(env, "refresh_tokens"),
			otp_challenges: await count(env, "otp_challenges"),
			audit_events: await count(env, "audit_events"),
		},
	};
	const d = new Date(generatedAt);
	const key = `auth-backups/${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}/snapshot-${d.getTime()}-${randomId("snap", 6)}.json`;
	await env.AUTH_BACKUP_BUCKET.put(key, JSON.stringify(summary, null, 2), {
		httpMetadata: { contentType: "application/json" },
	});
	return { key, snapshot: summary };
}

export async function exportAudit(env) {
	const rows = await env.AUTH_DB.prepare("SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 1000").all();
	const generatedAt = new Date().toISOString();
	const key = `audit-exports/${generatedAt.slice(0, 10)}/audit-${Date.now()}.jsonl`;
	const jsonl = (rows.results || []).map((row) => JSON.stringify(row)).join("\n");
	await env.AUTH_BACKUP_BUCKET.put(key, jsonl, { httpMetadata: { contentType: "application/x-ndjson" } });
	return { key, count: rows.results?.length || 0 };
}
