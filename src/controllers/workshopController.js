import { requireAppAuth } from "../middlewares/appAuth.js";
import { ok, readJson } from "../lib/response.js";
import { idempotencyKey, pagination } from "../lib/validation.js";
import {
	bookingCheckIn,
	bookingCreate,
	bookingDetail,
	bookingList,
	bookingStatusUpdate,
	mechanicsList,
	mechanicCreate,
	mechanicUpdate,
	operationalDashboard,
	serviceOrderDetail,
	serviceOrderAssign,
	serviceOrderList,
	serviceOrderTransition,
	taskComplete,
	taskCreate,
} from "../services/workshopService.js";

function listQuery(request) {
	const url = new URL(request.url);
	return {
		...pagination(url),
		q: String(url.searchParams.get("q") || "").trim().slice(0, 120),
		status: String(url.searchParams.get("status") || "").trim(),
		date: String(url.searchParams.get("date") || "").trim(),
		mechanicId: String(url.searchParams.get("mechanic_id") || "").trim(),
	};
}

export async function dashboardController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic", "cashier"], permission: "workshop:read" });
	return ok({ dashboard: await operationalDashboard(env), roles: auth.roles }, requestId);
}

export async function mechanicsController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "workshop:read" });
	return ok({ items: await mechanicsList(env) }, requestId);
}

export async function createMechanicController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "service:manage" });
	return ok({ mechanic: await mechanicCreate(env, await readJson(request, requestId), auth, requestId) }, requestId, 201);
}

export async function updateMechanicController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "service:manage" });
	return ok({ mechanic: await mechanicUpdate(env, params.id, await readJson(request, requestId), auth, requestId) }, requestId);
}

export async function listBookingsController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "workshop:read" });
	const query = listQuery(request);
	return ok({ ...await bookingList(env, query), page: query.page, limit: query.limit }, requestId);
}

export async function getBookingController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "workshop:read" });
	return ok({ booking: await bookingDetail(env, params.id, requestId) }, requestId);
}

export async function createBookingController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "booking:manage" });
	const body = await readJson(request, requestId);
	const result = await bookingCreate(env, body, auth, requestId, idempotencyKey(request, body, requestId));
	return ok(result, requestId, result.replayed ? 200 : 201);
}

export async function updateBookingController(request, env, _ctx, requestId, params) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "booking:manage" });
	return ok({ booking: await bookingStatusUpdate(env, params.id, await readJson(request, requestId), requestId) }, requestId);
}

export async function checkInBookingController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "booking:manage" });
	return ok(await bookingCheckIn(env, params.id, await readJson(request, requestId), auth, requestId), requestId);
}

export async function listServiceOrdersController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "workshop:read" });
	const query = listQuery(request);
	return ok({ ...await serviceOrderList(env, query, auth), page: query.page, limit: query.limit }, requestId);
}

export async function getServiceOrderController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "workshop:read" });
	return ok({ service_order: await serviceOrderDetail(env, params.id, requestId, auth) }, requestId);
}

export async function assignServiceOrderController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "service:manage" });
	return ok(await serviceOrderAssign(env, params.id, await readJson(request, requestId), auth, requestId), requestId);
}

export async function transitionServiceOrderController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "service:manage" });
	return ok(await serviceOrderTransition(env, params.id, await readJson(request, requestId), auth, requestId), requestId);
}

export async function createTaskController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "service:manage" });
	return ok({ task: await taskCreate(env, params.id, await readJson(request, requestId), auth, requestId) }, requestId, 201);
}

export async function completeTaskController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic"], permission: "service:manage" });
	return ok(await taskComplete(env, params.id, auth, requestId), requestId);
}
