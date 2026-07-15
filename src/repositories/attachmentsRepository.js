import { appDb, appBucket } from "../lib/bindings.js";

export async function saveAttachment(env, attachment, body) {
	const bucket = appBucket(env);
	if (!bucket) return null;
	await bucket.put(attachment.object_key, body, {
		httpMetadata: { contentType: attachment.content_type },
		customMetadata: { entityType: attachment.entity_type, entityId: attachment.entity_id },
	});
	try {
		await appDb(env).prepare(
			`INSERT INTO attachments (id,entity_type,entity_id,object_key,content_type,size_bytes,uploaded_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		).bind(attachment.id, attachment.entity_type, attachment.entity_id, attachment.object_key, attachment.content_type, attachment.size_bytes, attachment.uploaded_by).run();
	} catch (error) {
		try { await bucket.delete(attachment.object_key); } catch { /* Best-effort orphan cleanup. */ }
		throw error;
	}
	return attachment;
}

export async function getAttachment(env, id) {
	return appDb(env).prepare("SELECT * FROM attachments WHERE id=?").bind(id).first();
}

export async function getAttachmentObject(env, attachment) {
	const bucket = appBucket(env);
	return bucket ? bucket.get(attachment.object_key) : null;
}
