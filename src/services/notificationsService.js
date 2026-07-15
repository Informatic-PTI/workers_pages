import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../repositories/notificationsRepository.js";
import { httpError } from "../lib/response.js";

export async function notificationsList(env, auth, query) {
	return listNotifications(env, { userId: auth.user.id, roles: auth.roles, ...query });
}

export async function notificationRead(env, id, auth, requestId) {
	const notification = await markNotificationRead(env, id, auth.user.id, auth.roles);
	if (!notification) throw httpError("not_found", "Notifikasi tidak ditemukan", 404, requestId);
	return notification;
}

export async function notificationsReadAll(env, auth) {
	await markAllNotificationsRead(env, auth.user.id, auth.roles);
	return { marked: true };
}
