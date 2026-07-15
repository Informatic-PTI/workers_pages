import { randomId } from "../lib/crypto.js";
import { httpError } from "../lib/response.js";
import { requiredText } from "../lib/validation.js";
import { domainAudit } from "../lib/domainAudit.js";
import { getAttachment, getAttachmentObject, saveAttachment } from "../repositories/attachmentsRepository.js";
import { getVehicle } from "../repositories/customersRepository.js";
import { getSparePart } from "../repositories/inventoryRepository.js";
import { getMechanicByUser, getServiceOrder } from "../repositories/workshopRepository.js";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_SIZE = 5 * 1024 * 1024;

function extension(contentType) {
	return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" }[contentType];
}

async function assertAttachmentAccess(env, entityType, entityId, auth, requestId) {
	let resource;
	if (entityType === "vehicle") resource = await getVehicle(env, entityId);
	if (entityType === "spare_part") resource = await getSparePart(env, entityId);
	if (entityType === "service_order") resource = await getServiceOrder(env, entityId);
	if (!resource) throw httpError("not_found", "Resource lampiran tidak ditemukan", 404, requestId);
	if (entityType === "service_order" && auth?.roles.includes("mechanic") && !auth.roles.includes("admin")) {
		const mechanic = await getMechanicByUser(env, auth.user.id);
		if (!mechanic || resource.mechanic_id !== mechanic.id) throw httpError("forbidden", "Service Order ini tidak ditugaskan kepada Anda", 403, requestId);
	}
}

export async function attachmentUpload(env, request, auth, requestId) {
	if (!env.BUCKET) throw httpError("provider_not_configured", "Penyimpanan lampiran belum dikonfigurasi", 503, requestId);
	const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
	if (!ALLOWED_TYPES.has(contentType)) throw httpError("validation_error", "Tipe lampiran tidak didukung", 400, requestId);
	const declaredSize = Number(request.headers.get("content-length") || 0);
	if (!declaredSize || declaredSize > MAX_SIZE) throw httpError("validation_error", "Ukuran lampiran harus antara 1 byte dan 5 MB", 400, requestId);
	const entityType = requiredText(request.headers.get("x-entity-type"), "x-entity-type", requestId, 50).toLowerCase().replaceAll("-", "_");
	const entityId = requiredText(request.headers.get("x-entity-id"), "x-entity-id", requestId, 100);
	const id = randomId("att", 10);
	const family = entityType === "vehicle" ? "vehicles" : entityType === "service_order" ? "service-orders" : entityType === "spare_part" ? "spare-parts" : null;
	if (!family) throw httpError("validation_error", "Entity lampiran tidak didukung", 400, requestId);
	await assertAttachmentAccess(env, entityType, entityId, auth, requestId);
	const objectKey = `${family}/${entityId}/${id}.${extension(contentType)}`;
	const attachment = await saveAttachment(env, {
		id, entity_type: entityType, entity_id: entityId, object_key: objectKey,
		content_type: contentType, size_bytes: declaredSize, uploaded_by: auth.user.id,
	}, request.body);
	await domainAudit(env, { event_type: "attachment_uploaded", user_id: auth.user.id, request_id: requestId, target_type: entityType, target_id: entityId });
	return { ...attachment, url: `/files/${id}` };
}

export async function attachmentDownload(env, id, requestId, auth = null) {
	if (!env.BUCKET) throw httpError("provider_not_configured", "Penyimpanan lampiran belum dikonfigurasi", 503, requestId);
	const attachment = await getAttachment(env, id);
	if (!attachment) throw httpError("not_found", "Lampiran tidak ditemukan", 404, requestId);
	await assertAttachmentAccess(env, attachment.entity_type, attachment.entity_id, auth, requestId);
	const object = await getAttachmentObject(env, attachment);
	if (!object?.body) throw httpError("not_found", "Berkas lampiran tidak ditemukan", 404, requestId);
	return { attachment, object };
}
