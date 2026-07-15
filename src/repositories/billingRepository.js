import { appDb } from "../lib/bindings.js";

export async function listInvoices(env, { status = "", q = "", limit, offset }) {
	const clauses = [];
	const values = [];
	if (status) { clauses.push("i.status = ?"); values.push(status); }
	if (q) {
		clauses.push("(i.invoice_no LIKE ? OR so.order_no LIKE ? OR c.name LIKE ? OR v.license_plate LIKE ?)");
		const term = `%${q}%`;
		values.push(term, term, term, term);
	}
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT i.*, so.order_no, c.name AS customer_name, v.brand, v.model, v.license_plate,
			 p.method AS payment_method, p.payment_no
			 FROM invoices i JOIN service_orders so ON so.id=i.service_order_id
			 JOIN customers c ON c.id=so.customer_id JOIN vehicles v ON v.id=so.vehicle_id
			 LEFT JOIN payments p ON p.invoice_id=i.id AND p.status='paid'
			 ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
		).bind(...values, limit, offset).all(),
		db.prepare(
			`SELECT COUNT(*) AS total FROM invoices i JOIN service_orders so ON so.id=i.service_order_id
			 JOIN customers c ON c.id=so.customer_id JOIN vehicles v ON v.id=so.vehicle_id ${where}`,
		).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}

export async function getInvoice(env, id) {
	return appDb(env).prepare(
		`SELECT i.*, so.order_no, so.complaint, c.name AS customer_name, c.phone AS customer_phone,
		 v.brand, v.model, v.license_plate
		 FROM invoices i JOIN service_orders so ON so.id=i.service_order_id
		 JOIN customers c ON c.id=so.customer_id JOIN vehicles v ON v.id=so.vehicle_id WHERE i.id=?`,
	).bind(id).first();
}

export async function getInvoiceByServiceOrder(env, serviceOrderId) {
	return appDb(env).prepare("SELECT * FROM invoices WHERE service_order_id=?").bind(serviceOrderId).first();
}

export async function createInvoice(env, invoice) {
	const db = appDb(env);
	await db.prepare(
		`INSERT INTO invoices (id,invoice_no,service_order_id,subtotal,discount,tax,total,status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
	).bind(invoice.id, invoice.invoice_no, invoice.service_order_id, invoice.subtotal, invoice.discount, invoice.tax, invoice.total).run();
	return getInvoice(env, invoice.id);
}

export async function servicePartsTotal(env, serviceOrderId) {
	const row = await appDb(env).prepare(
		"SELECT COALESCE(SUM(quantity * unit_price), 0) AS total FROM service_order_parts WHERE service_order_id=? AND status<>'cancelled'",
	).bind(serviceOrderId).first();
	return Number(row?.total || 0);
}

export async function getPaymentByIdempotency(env, key) {
	return appDb(env).prepare("SELECT * FROM payments WHERE idempotency_key=?").bind(key).first();
}

export async function getPaidPayment(env, invoiceId) {
	return appDb(env).prepare("SELECT * FROM payments WHERE invoice_id=? AND status='paid' LIMIT 1").bind(invoiceId).first();
}

export async function payInvoice(env, payment) {
	const db = appDb(env);
	await db.batch([
		db.prepare(
			`INSERT INTO payments
			 (id,payment_no,invoice_id,method,amount,cash_received,change_amount,status,idempotency_key,processed_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?, ?)`,
		).bind(payment.id, payment.payment_no, payment.invoice_id, payment.method, payment.amount, payment.cash_received, payment.change_amount, payment.idempotency_key, payment.processed_by),
		db.prepare(
			`UPDATE invoices SET status='paid', paid_at=COALESCE(paid_at,CURRENT_TIMESTAMP), updated_at=CURRENT_TIMESTAMP
			 WHERE id=? AND status='unpaid'`,
		).bind(payment.invoice_id),
	]);
	return db.prepare("SELECT * FROM payments WHERE id=?").bind(payment.id).first();
}

export async function paymentHistory(env, { limit, offset }) {
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT p.*, i.invoice_no, c.name AS customer_name, so.order_no
			 FROM payments p JOIN invoices i ON i.id=p.invoice_id JOIN service_orders so ON so.id=i.service_order_id
			 JOIN customers c ON c.id=so.customer_id ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
		).bind(limit, offset).all(),
		db.prepare("SELECT COUNT(*) AS total FROM payments").first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}
