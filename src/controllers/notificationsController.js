import { requireAppAuth } from "../middlewares/appAuth.js";
import { ok } from "../lib/response.js";
import { pagination } from "../lib/validation.js";
import { notificationRead, notificationsList, notificationsReadAll } from "../services/notificationsService.js";

export async function listNotificationsController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic", "cashier"], permission: "notification:read" });
	const url = new URL(request.url);
	const query = { ...pagination(url), unreadOnly: url.searchParams.get("unread") === "true" };
	return ok({ ...await notificationsList(env, auth, query), page: query.page, limit: query.limit }, requestId);
}

export async function readNotificationController(request, env, _ctx, requestId, params) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic", "cashier"], permission: "notification:read" });
	return ok({ notification: await notificationRead(env, params.id, auth, requestId) }, requestId);
}

export async function readAllNotificationsController(request, env, _ctx, requestId) {
	const auth = await requireAppAuth(request, env, requestId, { roles: ["admin", "mechanic", "cashier"], permission: "notification:read" });
	return ok(await notificationsReadAll(env, auth), requestId);
}
