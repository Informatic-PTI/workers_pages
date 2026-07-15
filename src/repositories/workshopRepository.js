import { appDb } from "../lib/bindings.js";

export async function listMechanics(env) {
	const result = await appDb(env).prepare(
		`SELECT m.*,
		 COUNT(CASE WHEN so.status IN ('waiting','inspection','approval','in_progress','quality_check') THEN 1 END) AS active_orders
		 FROM mechanics m LEFT JOIN service_orders so ON so.mechanic_id = m.id
		 GROUP BY m.id ORDER BY m.name`,
	).all();
	return result.results || [];
}

export async function getMechanicByUser(env, userId) {
	return appDb(env).prepare("SELECT * FROM mechanics WHERE user_id = ?").bind(userId).first();
}

export async function getMechanic(env, id) {
	return appDb(env).prepare("SELECT * FROM mechanics WHERE id = ?").bind(id).first();
}

export async function insertMechanic(env, mechanic) {
	const db = appDb(env);
	await db.prepare(
		`INSERT INTO mechanics (id,user_id,name,phone,status,specialty)
		 VALUES (?, ?, ?, ?, ?, ?)`,
	).bind(mechanic.id, mechanic.user_id, mechanic.name, mechanic.phone, mechanic.status, mechanic.specialty).run();
	return getMechanic(env, mechanic.id);
}

export async function updateMechanic(env, id, mechanic) {
	await appDb(env).prepare(
		`UPDATE mechanics SET user_id=?, name=?, phone=?, status=?, specialty=?, updated_at=CURRENT_TIMESTAMP
		 WHERE id=?`,
	).bind(mechanic.user_id, mechanic.name, mechanic.phone, mechanic.status, mechanic.specialty, id).run();
	return getMechanic(env, id);
}

export async function getBooking(env, id) {
	return appDb(env).prepare(
		`SELECT b.*, c.name AS customer_name, c.phone AS customer_phone,
		 v.brand, v.model, v.license_plate
		 FROM bookings b
		 JOIN customers c ON c.id = b.customer_id
		 JOIN vehicles v ON v.id = b.vehicle_id
		 WHERE b.id = ?`,
	).bind(id).first();
}

export async function findBookingByIdempotency(env, key) {
	return appDb(env).prepare("SELECT * FROM bookings WHERE idempotency_key = ?").bind(key).first();
}

export async function listBookings(env, { q = "", status = "", date = "", limit, offset }) {
	const clauses = [];
	const values = [];
	if (q) {
		clauses.push("(b.booking_no LIKE ? OR c.name LIKE ? OR v.license_plate LIKE ?)");
		const term = `%${q}%`;
		values.push(term, term, term);
	}
	if (status) { clauses.push("b.status = ?"); values.push(status); }
	if (date) { clauses.push("date(b.scheduled_at) = date(?)"); values.push(date); }
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT b.*, c.name AS customer_name, c.phone AS customer_phone,
			 v.brand, v.model, v.license_plate
			 FROM bookings b JOIN customers c ON c.id = b.customer_id JOIN vehicles v ON v.id = b.vehicle_id
			 ${where} ORDER BY b.scheduled_at ASC LIMIT ? OFFSET ?`,
		).bind(...values, limit, offset).all(),
		db.prepare(
			`SELECT COUNT(*) AS total FROM bookings b JOIN customers c ON c.id = b.customer_id JOIN vehicles v ON v.id = b.vehicle_id ${where}`,
		).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}

export async function insertBooking(env, booking) {
	const db = appDb(env);
	await db.prepare(
		`INSERT INTO bookings (id,booking_no,customer_id,vehicle_id,scheduled_at,complaint,status,channel,idempotency_key,created_by)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	).bind(booking.id, booking.booking_no, booking.customer_id, booking.vehicle_id, booking.scheduled_at, booking.complaint, booking.status, booking.channel, booking.idempotency_key, booking.created_by).run();
	return getBooking(env, booking.id);
}

export async function updateBookingStatus(env, id, status) {
	const db = appDb(env);
	await db.prepare("UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, id).run();
	return getBooking(env, id);
}

export async function findServiceOrderByBooking(env, bookingId) {
	return appDb(env).prepare("SELECT * FROM service_orders WHERE booking_id = ?").bind(bookingId).first();
}

export async function checkInBooking(env, { booking, serviceOrder, activity }) {
	const db = appDb(env);
	await db.batch([
		db.prepare(
			`UPDATE bookings SET status = 'checked_in', service_order_id = ?, updated_at = CURRENT_TIMESTAMP
			 WHERE id = ? AND status IN ('scheduled','confirmed') AND service_order_id IS NULL`,
		).bind(serviceOrder.id, booking.id),
		db.prepare(
			`INSERT INTO service_orders (id,order_no,booking_id,customer_id,vehicle_id,mechanic_id,complaint,status,priority,created_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 'waiting', ?, ?)`,
		).bind(serviceOrder.id, serviceOrder.order_no, booking.id, booking.customer_id, booking.vehicle_id, serviceOrder.mechanic_id, booking.complaint, serviceOrder.priority, serviceOrder.created_by),
		db.prepare(
			"INSERT INTO service_activities (id,service_order_id,event_type,description,user_id) VALUES (?, ?, 'check_in', ?, ?)",
		).bind(activity.id, serviceOrder.id, activity.description, serviceOrder.created_by),
	]);
	return getServiceOrder(env, serviceOrder.id);
}

export async function listServiceOrders(env, { q = "", status = "", mechanicId = "", limit, offset }) {
	const clauses = [];
	const values = [];
	if (q) {
		clauses.push("(so.order_no LIKE ? OR c.name LIKE ? OR v.license_plate LIKE ?)");
		const term = `%${q}%`;
		values.push(term, term, term);
	}
	if (status) { clauses.push("so.status = ?"); values.push(status); }
	if (mechanicId) { clauses.push("so.mechanic_id = ?"); values.push(mechanicId); }
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT so.*, c.name AS customer_name, v.brand, v.model, v.license_plate, m.name AS mechanic_name,
			 i.id AS invoice_id, i.invoice_no, i.total AS invoice_total, i.status AS invoice_status
			 FROM service_orders so JOIN customers c ON c.id = so.customer_id JOIN vehicles v ON v.id = so.vehicle_id
			 LEFT JOIN mechanics m ON m.id = so.mechanic_id LEFT JOIN invoices i ON i.service_order_id = so.id
			 ${where} ORDER BY so.created_at DESC LIMIT ? OFFSET ?`,
		).bind(...values, limit, offset).all(),
		db.prepare(
			`SELECT COUNT(*) AS total FROM service_orders so JOIN customers c ON c.id = so.customer_id JOIN vehicles v ON v.id = so.vehicle_id ${where}`,
		).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}

export async function getServiceOrder(env, id) {
	return appDb(env).prepare(
		`SELECT so.*, c.name AS customer_name, c.phone AS customer_phone,
		 v.brand, v.model, v.license_plate, v.odometer, m.name AS mechanic_name,
		 i.id AS invoice_id, i.invoice_no, i.total AS invoice_total, i.status AS invoice_status
		 FROM service_orders so JOIN customers c ON c.id = so.customer_id JOIN vehicles v ON v.id = so.vehicle_id
		 LEFT JOIN mechanics m ON m.id = so.mechanic_id LEFT JOIN invoices i ON i.service_order_id = so.id
		 WHERE so.id = ?`,
	).bind(id).first();
}

export async function assignServiceOrderMechanic(env, id, mechanicId) {
	const db = appDb(env);
	await db.prepare(
		"UPDATE service_orders SET mechanic_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
	).bind(mechanicId, id).run();
	return getServiceOrder(env, id);
}

export async function serviceOrderChildren(env, id) {
	const db = appDb(env);
	const [tasks, parts, activities] = await Promise.all([
		db.prepare("SELECT * FROM service_tasks WHERE service_order_id = ? ORDER BY created_at").bind(id).all(),
		db.prepare(
			`SELECT sop.*, sp.name, sp.sku FROM service_order_parts sop
			 JOIN spare_parts sp ON sp.id = sop.spare_part_id WHERE sop.service_order_id = ? ORDER BY sop.created_at`,
		).bind(id).all(),
		db.prepare("SELECT * FROM service_activities WHERE service_order_id = ? ORDER BY created_at DESC LIMIT 100").bind(id).all(),
	]);
	return { tasks: tasks.results || [], parts: parts.results || [], activities: activities.results || [] };
}

export async function updateServiceOrderStatus(env, { id, fromStatuses, toStatus, userId, activityId, description }) {
	const placeholders = fromStatuses.map(() => "?").join(",");
	const db = appDb(env);
	const result = await db.batch([
		db.prepare(
			`UPDATE service_orders SET status = ?,
			 started_at = CASE WHEN ? = 'in_progress' THEN COALESCE(started_at, CURRENT_TIMESTAMP) ELSE started_at END,
			 completed_at = CASE WHEN ? = 'completed' THEN COALESCE(completed_at, CURRENT_TIMESTAMP) ELSE completed_at END,
			 updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN (${placeholders})`,
		).bind(toStatus, toStatus, toStatus, id, ...fromStatuses),
		db.prepare(
			`INSERT INTO service_activities (id,service_order_id,event_type,description,user_id)
			 SELECT ?, ?, 'status_changed', ?, ? WHERE changes() > 0`,
		).bind(activityId, id, description, userId),
	]);
	return { changed: Number(result[0]?.meta?.changes || 0), order: await getServiceOrder(env, id) };
}

export async function insertTask(env, task) {
	const db = appDb(env);
	await db.prepare(
		`INSERT INTO service_tasks (id,service_order_id,name,description,status,assigned_mechanic_id)
		 VALUES (?, ?, ?, ?, 'pending', ?)`,
	).bind(task.id, task.service_order_id, task.name, task.description, task.assigned_mechanic_id).run();
	return db.prepare("SELECT * FROM service_tasks WHERE id = ?").bind(task.id).first();
}

export async function getTaskWithOrder(env, taskId) {
	return appDb(env).prepare(
		`SELECT st.*, so.mechanic_id AS service_order_mechanic_id
		 FROM service_tasks st JOIN service_orders so ON so.id = st.service_order_id
		 WHERE st.id = ?`,
	).bind(taskId).first();
}

export async function completeTask(env, { taskId, userId, activityId }) {
	const db = appDb(env);
	const result = await db.batch([
		db.prepare(
			`UPDATE service_tasks SET status = 'completed', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP),
			 completed_by = COALESCE(completed_by, ?), updated_at = CURRENT_TIMESTAMP
			 WHERE id = ? AND status IN ('pending','in_progress')`,
		).bind(userId, taskId),
		db.prepare(
			`INSERT INTO service_activities (id,service_order_id,event_type,description,user_id)
			 SELECT ?, service_order_id, 'task_completed', 'Tugas service diselesaikan', ? FROM service_tasks WHERE id = ? AND changes() > 0`,
		).bind(activityId, userId, taskId),
	]);
	const task = await db.prepare("SELECT * FROM service_tasks WHERE id = ?").bind(taskId).first();
	return { changed: Number(result[0]?.meta?.changes || 0), task };
}

export async function dashboardSummary(env) {
	const db = appDb(env);
	const [revenue, orders, mechanics, vehicles, bookings, lowStock, statuses] = await Promise.all([
		db.prepare("SELECT COALESCE(SUM(total),0) AS value FROM invoices WHERE status='paid' AND date(paid_at)=date('now')").first(),
		db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed FROM service_orders WHERE date(created_at)=date('now')").first(),
		db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) AS available FROM mechanics").first(),
		db.prepare("SELECT COUNT(*) AS total FROM service_orders WHERE status IN ('waiting','inspection','approval','in_progress','quality_check')").first(),
		db.prepare("SELECT COUNT(*) AS total FROM bookings WHERE date(scheduled_at)=date('now') AND status IN ('scheduled','confirmed')").first(),
		db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN stock<=critical_stock THEN 1 ELSE 0 END) AS critical FROM spare_parts WHERE status='active' AND stock<=minimum_stock").first(),
		db.prepare("SELECT status, COUNT(*) AS total FROM service_orders WHERE status NOT IN ('completed','cancelled') GROUP BY status").all(),
	]);
	return { revenue, orders, mechanics, vehicles, bookings, low_stock: lowStock, workflow: statuses.results || [] };
}
