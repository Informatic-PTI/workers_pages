import { requireAppAuth } from "../middlewares/appAuth.js";
import { customerCreate, customerDetail, customersList, customerUpdate, vehicleCreate, vehicleDetail, vehiclesList, vehicleUpdateService } from "../services/customersService.js";
import { ok, readJson } from "../lib/response.js";
import { pagination } from "../lib/validation.js";

const CUSTOMER_ROLES = ["admin", "cashier"];

function queryOptions(request) {
	const url = new URL(request.url);
	return {
		...pagination(url),
		q: String(url.searchParams.get("q") || "").trim().slice(0, 120),
		status: String(url.searchParams.get("status") || "").trim(),
		customerId: String(url.searchParams.get("customer_id") || "").trim(),
	};
}

export async function listCustomersController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "workshop:read" });
	const query = queryOptions(request);
	const result = await customersList(env, query);
	return ok({ ...result, page: query.page, limit: query.limit }, requestId);
}

export async function getCustomerController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "workshop:read" });
	return ok({ customer: await customerDetail(env, params.id, requestId) }, requestId);
}

export async function createCustomerController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "customer:manage" });
	return ok({ customer: await customerCreate(env, await readJson(request, requestId), requestId) }, requestId, 201);
}

export async function updateCustomerController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "customer:manage" });
	return ok({ customer: await customerUpdate(env, params.id, await readJson(request, requestId), requestId) }, requestId);
}

export async function listVehiclesController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "workshop:read" });
	const query = queryOptions(request);
	const result = await vehiclesList(env, query);
	return ok({ ...result, page: query.page, limit: query.limit }, requestId);
}

export async function getVehicleController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "workshop:read" });
	return ok({ vehicle: await vehicleDetail(env, params.id, requestId) }, requestId);
}

export async function createVehicleController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "customer:manage" });
	return ok({ vehicle: await vehicleCreate(env, await readJson(request, requestId), requestId) }, requestId, 201);
}

export async function updateVehicleController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: CUSTOMER_ROLES, permission: "customer:manage" });
	return ok({ vehicle: await vehicleUpdateService(env, params.id, await readJson(request, requestId), requestId) }, requestId);
}
