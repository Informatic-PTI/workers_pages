import { randomDigits, randomId } from "../lib/crypto.js";
import { httpError } from "../lib/response.js";
import { cacheKeys, readAppCache, writeAppCache } from "../lib/appCache.js";
import { domainAudit } from "../lib/domainAudit.js";
import { enumValue, isoDateTime, optionalText, requiredText } from "../lib/validation.js";
import { getUser } from "../db/users.js";
import { getCustomer, getVehicle } from "../repositories/customersRepository.js";
import {
	checkInBooking,
	completeTask,
	assignServiceOrderMechanic,
	dashboardSummary,
	findBookingByIdempotency,
	findServiceOrderByBooking,
	getBooking,
	getMechanicByUser,
	getMechanic,
	getServiceOrder,
	getTaskWithOrder,
	insertMechanic,
	insertBooking,
	insertTask,
	listBookings,
	listMechanics,
	listServiceOrders,
	serviceOrderChildren,
	updateBookingStatus,
	updateMechanic,
	updateServiceOrderStatus,
} from "../repositories/workshopRepository.js";

const BOOKING_STATUSES = ["scheduled", "confirmed", "checked_in", "cancelled", "no_show"];
const SERVICE_TRANSITIONS = {
	waiting: ["inspection", "cancelled"],
	inspection: ["approval", "cancelled"],
	approval: ["in_progress", "cancelled"],
	in_progress: ["quality_check"],
	quality_check: ["ready", "in_progress"],
	ready: ["completed"],
	completed: [],
	cancelled: [],
};

function code(prefix) {
	const compactDate = new Date().toISOString().slice(2, 10).replaceAll("-", "");
	return `${prefix}-${compactDate}-${randomDigits(4)}`;
}

async function assertVehicleOwnership(env, customerId, vehicleId, requestId) {
	const [customer, vehicle] = await Promise.all([getCustomer(env, customerId), getVehicle(env, vehicleId)]);
	if (!customer) throw httpError("not_found", "Pelanggan tidak ditemukan", 404, requestId);
	if (!vehicle) throw httpError("not_found", "Kendaraan tidak ditemukan", 404, requestId);
	if (vehicle.customer_id !== customerId) throw httpError("validation_error", "Kendaraan bukan milik pelanggan yang dipilih", 400, requestId);
}

export async function bookingList(env, query) {
	return listBookings(env, query);
}

export async function bookingDetail(env, id, requestId) {
	const booking = await getBooking(env, id);
	if (!booking) throw httpError("not_found", "Booking tidak ditemukan", 404, requestId);
	return booking;
}

export async function bookingCreate(env, body, auth, requestId, idempotencyKey) {
	const existing = await findBookingByIdempotency(env, idempotencyKey);
	if (existing) return { booking: await getBooking(env, existing.id), replayed: true };
	const customerId = requiredText(body.customer_id, "customer_id", requestId, 80);
	const vehicleId = requiredText(body.vehicle_id, "vehicle_id", requestId, 80);
	await assertVehicleOwnership(env, customerId, vehicleId, requestId);
	try {
		const booking = await insertBooking(env, {
			id: randomId("bkg", 10), booking_no: code("BK"), customer_id: customerId, vehicle_id: vehicleId,
			scheduled_at: isoDateTime(body.scheduled_at, "scheduled_at", requestId),
			complaint: requiredText(body.complaint, "complaint", requestId, 1000), status: "scheduled",
			channel: optionalText(body.channel, 40) || "counter", idempotency_key: idempotencyKey, created_by: auth.user.id,
		});
		await domainAudit(env, { event_type: "booking_created", user_id: auth.user.id, request_id: requestId, target_type: "booking", target_id: booking.id });
		return { booking, replayed: false };
	} catch (error) {
		const concurrent = await findBookingByIdempotency(env, idempotencyKey);
		if (concurrent) return { booking: await getBooking(env, concurrent.id), replayed: true };
		throw error;
	}
}

export async function bookingStatusUpdate(env, id, body, requestId) {
	const booking = await getBooking(env, id);
	if (!booking) throw httpError("not_found", "Booking tidak ditemukan", 404, requestId);
	const status = enumValue(body.status, BOOKING_STATUSES, "status", requestId);
	const allowed = {
		scheduled: ["confirmed", "cancelled", "no_show"],
		confirmed: ["cancelled", "no_show"],
		checked_in: [], cancelled: [], no_show: [],
	}[booking.status] || [];
	if (status === booking.status) return booking;
	if (!allowed.includes(status)) throw httpError("invalid_transition", `Booking tidak dapat diubah dari ${booking.status} ke ${status}`, 409, requestId);
	return updateBookingStatus(env, id, status);
}

export async function bookingCheckIn(env, id, body, auth, requestId) {
	const booking = await getBooking(env, id);
	if (!booking) throw httpError("not_found", "Booking tidak ditemukan", 404, requestId);
	const existing = await findServiceOrderByBooking(env, id);
	if (existing) return { service_order: await serviceOrderDetail(env, existing.id, requestId), replayed: true };
	if (!["scheduled", "confirmed"].includes(booking.status)) throw httpError("invalid_transition", "Booking tidak dapat di-check-in", 409, requestId);
	try {
		const order = await checkInBooking(env, {
			booking,
			serviceOrder: {
				id: randomId("so", 10), order_no: code("SO"), mechanic_id: optionalText(body.mechanic_id, 80),
				priority: enumValue(body.priority, ["low", "normal", "high"], "priority", requestId, "normal"), created_by: auth.user.id,
			},
			activity: { id: randomId("act", 10), description: `Booking ${booking.booking_no} check-in` },
		});
		await domainAudit(env, { event_type: "booking_checked_in", user_id: auth.user.id, request_id: requestId, target_type: "service_order", target_id: order.id });
		return { service_order: await serviceOrderDetail(env, order.id, requestId), replayed: false };
	} catch (error) {
		const concurrent = await findServiceOrderByBooking(env, id);
		if (concurrent) return { service_order: await serviceOrderDetail(env, concurrent.id, requestId), replayed: true };
		throw error;
	}
}

export async function mechanicsList(env) {
	return listMechanics(env);
}

function mechanicPayload(body, requestId, current = {}) {
	return {
		user_id: body.user_id === undefined ? (current.user_id || null) : optionalText(body.user_id, 80),
		name: requiredText(body.name ?? current.name, "name", requestId, 160),
		phone: optionalText(body.phone ?? current.phone, 40),
		status: enumValue(body.status ?? current.status, ["available", "busy", "off_duty"], "status", requestId, "available"),
		specialty: optionalText(body.specialty ?? current.specialty, 300),
	};
}

async function validateMechanicAccount(env, payload, currentId, requestId) {
	if (!payload.user_id) return;
	if (!await getUser(env, payload.user_id)) throw httpError("not_found", "Akun pengguna tidak ditemukan", 404, requestId, { field: "user_id" });
	const linked = await getMechanicByUser(env, payload.user_id);
	if (linked && linked.id !== currentId) throw httpError("conflict", "Akun pengguna sudah terhubung ke mekanik lain", 409, requestId, { field: "user_id" });
}

export async function mechanicCreate(env, body, auth, requestId) {
	const payload = mechanicPayload(body, requestId);
	await validateMechanicAccount(env, payload, null, requestId);
	const mechanic = await insertMechanic(env, { id: randomId("mech", 10), ...payload });
	await domainAudit(env, { event_type: "mechanic_created", user_id: auth.user.id, request_id: requestId, target_type: "mechanic", target_id: mechanic.id });
	return mechanic;
}

export async function mechanicUpdate(env, id, body, auth, requestId) {
	const current = await getMechanic(env, id);
	if (!current) throw httpError("not_found", "Mekanik tidak ditemukan", 404, requestId);
	const payload = mechanicPayload(body, requestId, current);
	await validateMechanicAccount(env, payload, id, requestId);
	const mechanic = await updateMechanic(env, id, payload);
	await domainAudit(env, { event_type: "mechanic_updated", user_id: auth.user.id, request_id: requestId, target_type: "mechanic", target_id: mechanic.id });
	return mechanic;
}

export async function serviceOrderList(env, query, auth) {
	if (auth.roles.includes("mechanic") && !auth.roles.includes("admin")) {
		const mechanic = await getMechanicByUser(env, auth.user.id);
		query.mechanicId = mechanic?.id || "__none__";
	}
	return listServiceOrders(env, query);
}

export async function serviceOrderDetail(env, id, requestId, auth = null) {
	const order = await getServiceOrder(env, id);
	if (!order) throw httpError("not_found", "Service Order tidak ditemukan", 404, requestId);
	if (auth?.roles.includes("mechanic") && !auth.roles.includes("admin")) {
		const mechanic = await getMechanicByUser(env, auth.user.id);
		if (!mechanic || order.mechanic_id !== mechanic.id) throw httpError("forbidden", "Service Order ini tidak ditugaskan kepada Anda", 403, requestId);
	}
	return { ...order, ...await serviceOrderChildren(env, id) };
}

export async function serviceOrderAssign(env, id, body, auth, requestId) {
	const order = await getServiceOrder(env, id);
	if (!order) throw httpError("not_found", "Service Order tidak ditemukan", 404, requestId);
	if (["completed", "cancelled"].includes(order.status)) throw httpError("invalid_transition", "Service Order yang sudah ditutup tidak dapat ditugaskan ulang", 409, requestId);
	const mechanicId = requiredText(body.mechanic_id, "mechanic_id", requestId, 80);
	const mechanic = await getMechanic(env, mechanicId);
	if (!mechanic) throw httpError("not_found", "Mekanik tidak ditemukan", 404, requestId);
	const assigned = await assignServiceOrderMechanic(env, id, mechanicId);
	await domainAudit(env, { event_type: "service_mechanic_assigned", user_id: auth.user.id, request_id: requestId, target_type: "service_order", target_id: id });
	return { service_order: assigned, replayed: order.mechanic_id === mechanicId };
}

export async function serviceOrderTransition(env, id, body, auth, requestId) {
	const order = await serviceOrderDetail(env, id, requestId, auth);
	const toStatus = enumValue(body.status, Object.keys(SERVICE_TRANSITIONS), "status", requestId);
	if (toStatus === order.status) return { service_order: order, replayed: true };
	if (!SERVICE_TRANSITIONS[order.status]?.includes(toStatus)) {
		throw httpError("invalid_transition", `Service Order tidak dapat diubah dari ${order.status} ke ${toStatus}`, 409, requestId);
	}
	const result = await updateServiceOrderStatus(env, {
		id, fromStatuses: [order.status], toStatus, userId: auth.user.id, activityId: randomId("act", 10),
		description: `Status diubah dari ${order.status} ke ${toStatus}`,
	});
	if (!result.changed) {
		const current = await getServiceOrder(env, id);
		if (current?.status === toStatus) return { service_order: await serviceOrderDetail(env, id, requestId), replayed: true };
		throw httpError("conflict", "Status Service Order telah berubah, muat ulang data", 409, requestId);
	}
	await domainAudit(env, { event_type: "service_status_changed", user_id: auth.user.id, request_id: requestId, target_type: "service_order", target_id: id });
	return { service_order: await serviceOrderDetail(env, id, requestId), replayed: false };
}

export async function taskCreate(env, serviceOrderId, body, auth, requestId) {
	const order = await serviceOrderDetail(env, serviceOrderId, requestId, auth);
	if (["completed", "cancelled"].includes(order.status)) throw httpError("invalid_transition", "Tidak dapat menambah tugas pada Service Order ini", 409, requestId);
	const task = await insertTask(env, {
		id: randomId("task", 10), service_order_id: serviceOrderId,
		name: requiredText(body.name, "name", requestId, 160), description: optionalText(body.description, 500),
		assigned_mechanic_id: optionalText(body.assigned_mechanic_id, 80) || order.mechanic_id,
	});
	await domainAudit(env, { event_type: "service_task_created", user_id: auth.user.id, request_id: requestId, target_type: "service_task", target_id: task.id });
	return task;
}

export async function taskComplete(env, taskId, auth, requestId) {
	const existing = await getTaskWithOrder(env, taskId);
	if (!existing) throw httpError("not_found", "Tugas tidak ditemukan", 404, requestId);
	if (auth.roles.includes("mechanic") && !auth.roles.includes("admin")) {
		const mechanic = await getMechanicByUser(env, auth.user.id);
		const assignedId = existing.assigned_mechanic_id || existing.service_order_mechanic_id;
		if (!mechanic || assignedId !== mechanic.id) throw httpError("forbidden", "Tugas ini tidak ditugaskan kepada Anda", 403, requestId);
	}
	const result = await completeTask(env, { taskId, userId: auth.user.id, activityId: randomId("act", 10) });
	if (result.changed) await domainAudit(env, { event_type: "service_task_completed", user_id: auth.user.id, request_id: requestId, target_type: "service_task", target_id: taskId });
	return { task: result.task, replayed: !result.changed };
}

export async function operationalDashboard(env) {
	const key = cacheKeys.dashboard();
	const cached = await readAppCache(env, key);
	if (cached) return cached;
	const dashboard = await dashboardSummary(env);
	await writeAppCache(env, key, dashboard, 30);
	return dashboard;
}
