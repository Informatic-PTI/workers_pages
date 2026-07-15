import { appDb } from "../lib/bindings.js";

export async function analyticsReport(env, from, to) {
	const db = appDb(env);
	const params = [from, to];
	const [summary, revenueTrend, serviceTrend, paymentMethods, topParts] = await Promise.all([
		db.prepare(
			`SELECT COALESCE(SUM(CASE WHEN i.status='paid' THEN i.total ELSE 0 END),0) AS revenue,
			 COUNT(DISTINCT so.id) AS service_orders,
			 COALESCE(AVG(CASE WHEN i.status='paid' THEN i.total END),0) AS average_invoice,
			 COUNT(DISTINCT so.customer_id) AS customers
			 FROM service_orders so LEFT JOIN invoices i ON i.service_order_id=so.id
			 WHERE date(so.created_at) BETWEEN date(?) AND date(?)`,
		).bind(...params).first(),
		db.prepare(
			`SELECT date(paid_at) AS date, SUM(total) AS revenue FROM invoices
			 WHERE status='paid' AND date(paid_at) BETWEEN date(?) AND date(?) GROUP BY date(paid_at) ORDER BY date`,
		).bind(...params).all(),
		db.prepare(
			`SELECT date(created_at) AS date, COUNT(*) AS total FROM service_orders
			 WHERE date(created_at) BETWEEN date(?) AND date(?) GROUP BY date(created_at) ORDER BY date`,
		).bind(...params).all(),
		db.prepare(
			`SELECT p.method, COUNT(*) AS count, SUM(p.amount) AS amount FROM payments p
			 WHERE p.status='paid' AND date(p.created_at) BETWEEN date(?) AND date(?) GROUP BY p.method`,
		).bind(...params).all(),
		db.prepare(
			`SELECT sp.name, sp.sku, SUM(sop.quantity) AS quantity, SUM(sop.quantity*sop.unit_price) AS revenue
			 FROM service_order_parts sop JOIN spare_parts sp ON sp.id=sop.spare_part_id
			 WHERE date(sop.created_at) BETWEEN date(?) AND date(?) GROUP BY sp.id ORDER BY quantity DESC LIMIT 10`,
		).bind(...params).all(),
	]);
	return {
		summary,
		revenue_trend: revenueTrend.results || [],
		service_trend: serviceTrend.results || [],
		payment_methods: paymentMethods.results || [],
		top_parts: topParts.results || [],
	};
}
