import { appDb } from "../lib/bindings.js";

export async function listSpareParts(env, { q = "", status = "", stockState = "", limit, offset }) {
	const clauses = [];
	const values = [];
	if (q) {
		clauses.push("(name LIKE ? OR sku LIKE ? OR category LIKE ?)");
		const term = `%${q}%`;
		values.push(term, term, term);
	}
	if (status) { clauses.push("status = ?"); values.push(status); }
	if (stockState === "low") clauses.push("stock <= minimum_stock");
	if (stockState === "critical") clauses.push("stock <= critical_stock");
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT *, CASE WHEN stock <= critical_stock THEN 'critical' WHEN stock <= minimum_stock THEN 'low' ELSE 'safe' END AS stock_state
			 FROM spare_parts ${where} ORDER BY name LIMIT ? OFFSET ?`,
		).bind(...values, limit, offset).all(),
		db.prepare(`SELECT COUNT(*) AS total FROM spare_parts ${where}`).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}

export async function getSparePart(env, id) {
	return appDb(env).prepare(
		`SELECT *, CASE WHEN stock <= critical_stock THEN 'critical' WHEN stock <= minimum_stock THEN 'low' ELSE 'safe' END AS stock_state
		 FROM spare_parts WHERE id = ?`,
	).bind(id).first();
}

export async function findSparePartBySku(env, sku) {
	return appDb(env).prepare("SELECT * FROM spare_parts WHERE sku = ?").bind(sku).first();
}

export async function insertSparePart(env, part) {
	const db = appDb(env);
	await db.prepare(
		`INSERT INTO spare_parts (id,sku,name,category,purchase_price,selling_price,stock,minimum_stock,critical_stock,location,status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	).bind(part.id, part.sku, part.name, part.category, part.purchase_price, part.selling_price, part.stock, part.minimum_stock, part.critical_stock, part.location, part.status).run();
	return getSparePart(env, part.id);
}

export async function updateSparePart(env, id, part) {
	const db = appDb(env);
	await db.prepare(
		`UPDATE spare_parts SET sku=?, name=?, category=?, purchase_price=?, selling_price=?, minimum_stock=?, critical_stock=?, location=?, status=?, updated_at=CURRENT_TIMESTAMP
		 WHERE id=?`,
	).bind(part.sku, part.name, part.category, part.purchase_price, part.selling_price, part.minimum_stock, part.critical_stock, part.location, part.status, id).run();
	return getSparePart(env, id);
}

export async function listMovements(env, sparePartId, limit = 100) {
	const result = await appDb(env).prepare(
		`SELECT im.*, u.display_name AS user_name FROM inventory_movements im
		 LEFT JOIN users u ON u.id = im.created_by WHERE im.spare_part_id = ?
		 ORDER BY im.created_at DESC LIMIT ?`,
	).bind(sparePartId, limit).all();
	return result.results || [];
}

export async function listPartCompatibility(env, sparePartId) {
	const result = await appDb(env).prepare(
		`SELECT id,brand,model,year_start,year_end
		 FROM spare_part_compatibility WHERE spare_part_id=? ORDER BY brand,model,year_start`,
	).bind(sparePartId).all();
	return result.results || [];
}

export async function replacePartCompatibility(env, sparePartId, items) {
	const db = appDb(env);
	const statements = [db.prepare("DELETE FROM spare_part_compatibility WHERE spare_part_id = ?").bind(sparePartId)];
	for (const item of items) {
		statements.push(db.prepare(
			`INSERT INTO spare_part_compatibility (id,spare_part_id,brand,model,year_start,year_end)
			 VALUES (?, ?, ?, ?, ?, ?)`,
		).bind(item.id, sparePartId, item.brand, item.model, item.year_start, item.year_end));
	}
	await db.batch(statements);
	return listPartCompatibility(env, sparePartId);
}

export async function listStockTrend(env, sparePartId) {
	const result = await appDb(env).prepare(
		`SELECT created_at,quantity_after AS stock
		 FROM inventory_movements WHERE spare_part_id=?
		 ORDER BY created_at DESC,id DESC LIMIT 30`,
	).bind(sparePartId).all();
	return result.results || [];
}

export async function findMovementByIdempotency(env, key) {
	return appDb(env).prepare("SELECT * FROM inventory_movements WHERE idempotency_key = ?").bind(key).first();
}

export async function applyMovement(env, movement) {
	const db = appDb(env);
	const result = await db.batch([
		db.prepare(
			`INSERT INTO inventory_movements
			 (id,spare_part_id,type,reference_type,reference_id,delta,quantity_before,quantity_after,note,idempotency_key,created_by)
			 SELECT ?, id, ?, ?, ?, ?, stock, stock + ?, ?, ?, ?
			 FROM spare_parts WHERE id = ? AND status = 'active' AND stock + ? >= 0`,
		).bind(movement.id, movement.type, movement.reference_type, movement.reference_id, movement.delta, movement.delta, movement.note, movement.idempotency_key, movement.created_by, movement.spare_part_id, movement.delta),
		db.prepare(
			`UPDATE spare_parts SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP
			 WHERE id = ? AND EXISTS (SELECT 1 FROM inventory_movements WHERE id = ?)`,
		).bind(movement.delta, movement.spare_part_id, movement.id),
	]);
	return { changed: Number(result[0]?.meta?.changes || 0), movement: await db.prepare("SELECT * FROM inventory_movements WHERE id = ?").bind(movement.id).first() };
}

export async function listSuppliers(env) {
	const result = await appDb(env).prepare("SELECT * FROM suppliers ORDER BY name").all();
	return result.results || [];
}

export async function getSupplier(env, id) {
	return appDb(env).prepare("SELECT * FROM suppliers WHERE id = ?").bind(id).first();
}

export async function findSupplierByName(env, name) {
	return appDb(env).prepare("SELECT * FROM suppliers WHERE lower(name) = lower(?)").bind(name).first();
}

export async function insertSupplier(env, supplier) {
	await appDb(env).prepare(
		"INSERT INTO suppliers (id,name,phone,email,address) VALUES (?, ?, ?, ?, ?)",
	).bind(supplier.id, supplier.name, supplier.phone, supplier.email, supplier.address).run();
	return getSupplier(env, supplier.id);
}

export async function updateSupplier(env, id, supplier) {
	await appDb(env).prepare(
		"UPDATE suppliers SET name=?, phone=?, email=?, address=? WHERE id=?",
	).bind(supplier.name, supplier.phone, supplier.email, supplier.address, id).run();
	return getSupplier(env, id);
}

export async function findReceiptByIdempotency(env, key) {
	return appDb(env).prepare("SELECT * FROM stock_receipts WHERE idempotency_key = ?").bind(key).first();
}

export async function createStockReceipt(env, receipt, items) {
	const db = appDb(env);
	const statements = [
		db.prepare(
			`INSERT INTO stock_receipts
			 (id,receipt_no,supplier_id,received_at,supplier_document_no,note,total_amount,status,idempotency_key,created_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?, 'posted', ?, ?)`,
		).bind(receipt.id, receipt.receipt_no, receipt.supplier_id, receipt.received_at, receipt.supplier_document_no, receipt.note, receipt.total_amount, receipt.idempotency_key, receipt.created_by),
	];
	for (const item of items) {
		statements.push(
			db.prepare(
				"INSERT INTO stock_receipt_items (id,stock_receipt_id,spare_part_id,quantity,unit_cost,subtotal) VALUES (?, ?, ?, ?, ?, ?)",
			).bind(item.id, receipt.id, item.spare_part_id, item.quantity, item.unit_cost, item.subtotal),
			db.prepare(
				`INSERT INTO inventory_movements
				 (id,spare_part_id,type,reference_type,reference_id,delta,quantity_before,quantity_after,note,idempotency_key,created_by)
				 SELECT ?, id, 'stock_in', 'stock_receipt', ?, ?, stock, stock + ?, 'Penerimaan stok', ?, ?
				 FROM spare_parts WHERE id = ? AND status = 'active'`,
			).bind(item.movement_id, receipt.id, item.quantity, item.quantity, `${receipt.idempotency_key}:${item.spare_part_id}`, receipt.created_by, item.spare_part_id),
			db.prepare(
				`UPDATE spare_parts SET stock = stock + ?, purchase_price = ?, updated_at = CURRENT_TIMESTAMP
				 WHERE id = ? AND EXISTS (SELECT 1 FROM inventory_movements WHERE id = ?)`,
			).bind(item.quantity, item.unit_cost, item.spare_part_id, item.movement_id),
		);
	}
	await db.batch(statements);
	return getStockReceipt(env, receipt.id);
}

export async function getStockReceipt(env, id) {
	const db = appDb(env);
	const [receipt, items] = await Promise.all([
		db.prepare(
			`SELECT sr.*, s.name AS supplier_name FROM stock_receipts sr JOIN suppliers s ON s.id=sr.supplier_id WHERE sr.id=?`,
		).bind(id).first(),
		db.prepare(
			`SELECT sri.*, sp.name, sp.sku FROM stock_receipt_items sri JOIN spare_parts sp ON sp.id=sri.spare_part_id WHERE sri.stock_receipt_id=?`,
		).bind(id).all(),
	]);
	return receipt ? { ...receipt, items: items.results || [] } : null;
}

export async function listStockReceipts(env, { q = "", supplierId = "", limit, offset }) {
	const clauses = [];
	const values = [];
	if (q) {
		clauses.push("(sr.receipt_no LIKE ? OR sr.supplier_document_no LIKE ? OR s.name LIKE ?)");
		const term = `%${q}%`;
		values.push(term, term, term);
	}
	if (supplierId) { clauses.push("sr.supplier_id = ?"); values.push(supplierId); }
	const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT sr.*, s.name AS supplier_name, COUNT(sri.id) AS item_count,
			 COALESCE(SUM(sri.quantity),0) AS total_quantity
			 FROM stock_receipts sr JOIN suppliers s ON s.id=sr.supplier_id
			 LEFT JOIN stock_receipt_items sri ON sri.stock_receipt_id=sr.id
			 ${where} GROUP BY sr.id ORDER BY sr.received_at DESC, sr.created_at DESC LIMIT ? OFFSET ?`,
		).bind(...values, limit, offset).all(),
		db.prepare(
			`SELECT COUNT(*) AS total FROM stock_receipts sr JOIN suppliers s ON s.id=sr.supplier_id ${where}`,
		).bind(...values).first(),
	]);
	return { items: rows.results || [], total: Number(count?.total || 0) };
}

export async function addServicePart(env, entry) {
	const db = appDb(env);
	await db.batch([
		db.prepare(
			`INSERT INTO inventory_movements
			 (id,spare_part_id,type,reference_type,reference_id,delta,quantity_before,quantity_after,note,idempotency_key,created_by)
			 SELECT ?, id, 'service_use', 'service_order', ?, ?, stock, stock + ?, 'Pemakaian service', ?, ?
			 FROM spare_parts WHERE id = ? AND status='active' AND stock + ? >= 0`,
		).bind(entry.movement_id, entry.service_order_id, -entry.quantity, -entry.quantity, entry.idempotency_key, entry.created_by, entry.spare_part_id, -entry.quantity),
		db.prepare(
			`INSERT INTO service_order_parts (id,service_order_id,spare_part_id,quantity,unit_price,status)
			 SELECT ?, ?, ?, ?, ?, 'consumed' WHERE EXISTS (SELECT 1 FROM inventory_movements WHERE id=?)`,
		).bind(entry.id, entry.service_order_id, entry.spare_part_id, entry.quantity, entry.unit_price, entry.movement_id),
		db.prepare(
			`UPDATE spare_parts SET stock = stock - ?, updated_at=CURRENT_TIMESTAMP
			 WHERE id=? AND EXISTS (SELECT 1 FROM inventory_movements WHERE id=?)`,
		).bind(entry.quantity, entry.spare_part_id, entry.movement_id),
	]);
	return db.prepare("SELECT * FROM service_order_parts WHERE id=?").bind(entry.id).first();
}
