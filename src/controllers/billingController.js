import { requireAppAuth } from "../middlewares/appAuth.js";
import { ok, readJson } from "../lib/response.js";
import { idempotencyKey, pagination } from "../lib/validation.js";
import { invoiceCreate, invoiceDetail, invoicesList, paymentCreate, paymentProviderStatus, transactionsList } from "../services/billingService.js";

function queryOptions(request) {
	const url = new URL(request.url);
	return { ...pagination(url), q: String(url.searchParams.get("q") || "").trim().slice(0, 120), status: String(url.searchParams.get("status") || "").trim() };
}

export async function listInvoicesController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin", "cashier"], permission: "workshop:read" });
	const query = queryOptions(request);
	return ok({ ...await invoicesList(env, query), page: query.page, limit: query.limit }, requestId);
}

export async function getInvoiceController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: ["admin", "cashier"], permission: "workshop:read" });
	return ok({ invoice: await invoiceDetail(env, params.id, requestId) }, requestId);
}

export async function createInvoiceController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "service:manage" });
	const result = await invoiceCreate(env, params.id, await readJson(request, requestId), requestId, auth);
	return ok(result, requestId, result.replayed ? 200 : 201);
}

export async function payInvoiceController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "cashier"], permission: "payment:manage" });
	const body = await readJson(request, requestId);
	return ok(await paymentCreate(env, params.id, body, auth, requestId, idempotencyKey(request, body, requestId)), requestId, 201);
}

export async function providersController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin", "cashier", "mechanic"], permission: "workshop:read" });
	return ok({ providers: await paymentProviderStatus(env) }, requestId);
}

export async function transactionsController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin", "cashier"], permission: "payment:manage" });
	const query = queryOptions(request);
	return ok({ ...await transactionsList(env, query), page: query.page, limit: query.limit }, requestId);
}
