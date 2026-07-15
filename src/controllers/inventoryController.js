import { requireAppAuth } from "../middlewares/appAuth.js";
import { ok, readJson } from "../lib/response.js";
import { idempotencyKey, pagination } from "../lib/validation.js";
import {
	inventoryMovement, servicePartAdd, sparePartCreate, sparePartDetail, sparePartsList, sparePartUpdate,
	stockReceiptCreate, stockReceiptDetail, stockReceiptsList, supplierCreate, suppliersList, supplierUpdate,
} from "../services/inventoryService.js";

function queryOptions(request) {
	const url = new URL(request.url);
	return {
		...pagination(url), q: String(url.searchParams.get("q") || "").trim().slice(0, 120),
		status: String(url.searchParams.get("status") || "").trim(), stockState: String(url.searchParams.get("stock") || "").trim(),
	};
}

export async function listSparePartsController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "workshop:read" });
	const query = queryOptions(request);
	return ok({ ...await sparePartsList(env, query), page: query.page, limit: query.limit }, requestId);
}

export async function getSparePartController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "workshop:read" });
	return ok({ spare_part: await sparePartDetail(env, params.id, requestId) }, requestId);
}

export async function createSparePartController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	return ok({ spare_part: await sparePartCreate(env, await readJson(request, requestId), auth, requestId) }, requestId, 201);
}

export async function updateSparePartController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	return ok({ spare_part: await sparePartUpdate(env, params.id, await readJson(request, requestId), auth, requestId) }, requestId);
}

export async function movementController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	const body = await readJson(request, requestId);
	return ok(await inventoryMovement(env, params.id, body, auth, requestId, idempotencyKey(request, body, requestId)), requestId, 201);
}

export async function suppliersController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	return ok({ items: await suppliersList(env) }, requestId);
}

export async function createSupplierController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	return ok({ supplier: await supplierCreate(env, await readJson(request, requestId), auth, requestId) }, requestId, 201);
}

export async function updateSupplierController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	return ok({ supplier: await supplierUpdate(env, params.id, await readJson(request, requestId), auth, requestId) }, requestId);
}

export async function listStockReceiptsController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	const url = new URL(request.url);
	const query = {
		...pagination(url),
		q: String(url.searchParams.get("q") || "").trim().slice(0, 120),
		supplierId: String(url.searchParams.get("supplier_id") || "").trim(),
	};
	return ok({ ...await stockReceiptsList(env, query), page: query.page, limit: query.limit }, requestId);
}

export async function getStockReceiptController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	return ok({ receipt: await stockReceiptDetail(env, params.id, requestId) }, requestId);
}

export async function stockReceiptController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "inventory:manage" });
	const body = await readJson(request, requestId);
	const result = await stockReceiptCreate(env, body, auth, requestId, idempotencyKey(request, body, requestId));
	return ok(result, requestId, result.replayed ? 200 : 201);
}

export async function addServicePartController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "service:manage" });
	const body = await readJson(request, requestId);
	const result = await servicePartAdd(env, params.id, body, auth, requestId, idempotencyKey(request, body, requestId));
	return ok(result, requestId, result.replayed ? 200 : 201);
}
