import { requireAppAuth } from "../middlewares/appAuth.js";
import { ok } from "../lib/response.js";
import { attachmentDownload, attachmentUpload } from "../services/attachmentsService.js";

export async function uploadAttachmentController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "service:manage" });
	return ok({ attachment: await attachmentUpload(env, request, auth, requestId) }, requestId, 201);
}

export async function downloadAttachmentController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic", "cashier"], permission: "workshop:read" });
	const { attachment, object } = await attachmentDownload(env, params.id, requestId, auth);
	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set("etag", object.httpEtag);
	headers.set("cache-control", "private, max-age=60");
	return new Response(object.body, { headers });
}
