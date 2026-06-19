import { createSnapshot } from "../lib/backup.js";
import { insertAuditEvent } from "../db/auditEvents.js";

export async function processBackupMessage(env, body) {
	if (body.type !== "backup_snapshot") return;
	const result = await createSnapshot(env);
	await insertAuditEvent(env, {
		event_type: "backup_snapshot_created",
		outcome: "success",
		request_id: body.request_id,
		metadata: { key: result.key, source: "queue" },
	});
}
