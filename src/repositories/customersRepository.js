import { appDb } from "../lib/bindings.js";

export async function findCustomerByPhone(env, phone) {
	return appDb(env).prepare("SELECT * FROM customers WHERE phone = ?").bind(phone).first();
}

export async function listCustomers(env, { q = "", status = "", limit, offset }) {
	const clauses = [];
	const values = [];
	if (q) {
		clauses.push("(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)");
		const term = `%${q}%`;
		values.push(term, term, term);
	}
	if (status) {
		clauses.push("c.status = ?");
		values.push(status);
	}
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT c.*,
			 COUNT(DISTINCT v.id) AS vehicle_count,
			 COUNT(DISTINCT so.id) AS service_count,
			 COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) AS total_spent,
			 MAX(so.created_at) AS last_service_at
			 FROM customers c
			 LEFT JOIN vehicles v ON v.customer_id = c.id
			 LEFT JOIN service_orders so ON so.customer_id = c.id
			 LEFT JOIN invoices i ON i.service_order_id = so.id
			 ${where}
			 GROUP BY c.id
			 ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
		).bind(...values, limit, offset).all(),
		db.prepare(`SELECT COUNT(*) AS total FROM customers c ${where}`).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}

export async function getCustomer(env, id) {
	return appDb(env).prepare("SELECT * FROM customers WHERE id = ?").bind(id).first();
}

export async function insertCustomer(env, customer) {
	const db = appDb(env);
	await db.prepare(
		`INSERT INTO customers (id,name,phone,email,address,status)
		 VALUES (?, ?, ?, ?, ?, ?)`,
	).bind(customer.id, customer.name, customer.phone, customer.email, customer.address, customer.status).run();
	return getCustomer(env, customer.id);
}

export async function updateCustomer(env, id, customer) {
	const db = appDb(env);
	await db.prepare(
		`UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
	).bind(customer.name, customer.phone, customer.email, customer.address, customer.status, id).run();
	return getCustomer(env, id);
}

export async function findVehicleByPlate(env, licensePlate) {
	return appDb(env).prepare("SELECT * FROM vehicles WHERE license_plate = ?").bind(licensePlate).first();
}

export async function listVehicles(env, { q = "", customerId = "", limit, offset }) {
	const clauses = [];
	const values = [];
	if (q) {
		clauses.push("(v.license_plate LIKE ? OR v.brand LIKE ? OR v.model LIKE ? OR c.name LIKE ?)");
		const term = `%${q}%`;
		values.push(term, term, term, term);
	}
	if (customerId) {
		clauses.push("v.customer_id = ?");
		values.push(customerId);
	}
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT v.*, c.name AS customer_name, c.phone AS customer_phone,
			 COUNT(so.id) AS service_count, MAX(so.created_at) AS last_service_at
			 FROM vehicles v JOIN customers c ON c.id = v.customer_id
			 LEFT JOIN service_orders so ON so.vehicle_id = v.id
			 ${where} GROUP BY v.id ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
		).bind(...values, limit, offset).all(),
		db.prepare(`SELECT COUNT(*) AS total FROM vehicles v JOIN customers c ON c.id = v.customer_id ${where}`).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}

export async function getVehicle(env, id) {
	return appDb(env).prepare(
		`SELECT v.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email
		 FROM vehicles v JOIN customers c ON c.id = v.customer_id WHERE v.id = ?`,
	).bind(id).first();
}

export async function vehicleServiceHistory(env, id) {
	const result = await appDb(env).prepare(
		`SELECT so.id, so.order_no, so.status, so.complaint, so.created_at, so.completed_at,
		 m.name AS mechanic_name, i.invoice_no, i.total, i.status AS invoice_status
		 FROM service_orders so
		 LEFT JOIN mechanics m ON m.id = so.mechanic_id
		 LEFT JOIN invoices i ON i.service_order_id = so.id
		 WHERE so.vehicle_id = ? ORDER BY so.created_at DESC LIMIT 50`,
	).bind(id).all();
	return result.results || [];
}

export async function insertVehicle(env, vehicle) {
	const db = appDb(env);
	await db.prepare(
		`INSERT INTO vehicles (id,customer_id,brand,model,year,license_plate,color,odometer)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	).bind(vehicle.id, vehicle.customer_id, vehicle.brand, vehicle.model, vehicle.year, vehicle.license_plate, vehicle.color, vehicle.odometer).run();
	return getVehicle(env, vehicle.id);
}

export async function updateVehicle(env, id, vehicle) {
	const db = appDb(env);
	await db.prepare(
		`UPDATE vehicles SET customer_id = ?, brand = ?, model = ?, year = ?, license_plate = ?, color = ?, odometer = ?, updated_at = CURRENT_TIMESTAMP
		 WHERE id = ?`,
	).bind(vehicle.customer_id, vehicle.brand, vehicle.model, vehicle.year, vehicle.license_plate, vehicle.color, vehicle.odometer, id).run();
	return getVehicle(env, id);
}
