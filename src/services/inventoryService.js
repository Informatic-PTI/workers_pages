import { randomDigits, randomId } from "../lib/crypto.js";
import { httpError } from "../lib/response.js";
import { domainAudit } from "../lib/domainAudit.js";
import { enumValue, isoDateTime, optionalText, positiveInteger, requiredText } from "../lib/validation.js";
import {
	addServicePart,
	applyMovement,
	createStockReceipt,
	findSupplierByName,
	findMovementByIdempotency,
	findReceiptByIdempotency,
	findSparePartBySku,
	getSparePart,
	getStockReceipt,
	getSupplier,
	insertSupplier,
	insertSparePart,
	listMovements,
	listPartCompatibility,
	listSpareParts,
	listStockTrend,
	listStockReceipts,
	listSuppliers,
	replacePartCompatibility,
	updateSupplier,
	updateSparePart,
} from "../repositories/inventoryRepository.js";
import { getMechanicByUser, getServiceOrder } from "../repositories/workshopRepository.js";

const MOVEMENT_TYPES = ["stock_in", "service_use", "direct_sale", "adjustment_in", "adjustment_out", "return"];

function partPayload(body, requestId, current = {}) {
	const payload = {
		sku: requiredText(body.sku ?? current.sku, "sku", requestId, 80).toUpperCase(),
		name: requiredText(body.name ?? current.name, "name", requestId, 180),
		category: requiredText(body.category ?? current.category, "category", requestId, 100),
		purchase_price: positiveInteger(body.purchase_price ?? current.purchase_price ?? 0, "purchase_price", requestId, { allowZero: true }),
		selling_price: positiveInteger(body.selling_price ?? current.selling_price ?? 0, "selling_price", requestId, { allowZero: true }),
		minimum_stock: positiveInteger(body.minimum_stock ?? current.minimum_stock ?? 0, "minimum_stock", requestId, { allowZero: true }),
		critical_stock: positiveInteger(body.critical_stock ?? current.critical_stock ?? 0, "critical_stock", requestId, { allowZero: true }),
		location: optionalText(body.location ?? current.location, 100),
		status: (body.status ?? current.status) === "inactive" ? "inactive" : "active",
	};
	if (payload.critical_stock > payload.minimum_stock) {
		throw httpError("validation_error", "Stok kritis tidak boleh lebih besar dari stok minimum", 400, requestId, { field: "critical_stock" });
	}
	return payload;
}

function compatibilityPayload(value, requestId) {
	if (value === undefined) return null;
	if (!Array.isArray(value)) throw httpError("validation_error", "compatibility harus berupa daftar", 400, requestId, { field: "compatibility" });
	if (value.length > 100) throw httpError("validation_error", "Maksimal 100 kompatibilitas per sparepart", 400, requestId, { field: "compatibility" });
	const seen = new Set();
	return value.map((item, index) => {
		const brand = requiredText(item?.brand, `compatibility.${index}.brand`, requestId, 80);
		const model = requiredText(item?.model, `compatibility.${index}.model`, requestId, 120);
		const yearStart = item?.year_start === "" || item?.year_start === null || item?.year_start === undefined ? null : Number(item.year_start);
		const yearEnd = item?.year_end === "" || item?.year_end === null || item?.year_end === undefined ? null : Number(item.year_end);
		for (const [field, year] of [["year_start", yearStart], ["year_end", yearEnd]]) {
			if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
				throw httpError("validation_error", `${field} kompatibilitas tidak valid`, 400, requestId, { field: `compatibility.${index}.${field}` });
			}
		}
		if (yearStart !== null && yearEnd !== null && yearEnd < yearStart) {
			throw httpError("validation_error", "Tahun akhir tidak boleh lebih kecil dari tahun awal", 400, requestId, { field: `compatibility.${index}.year_end` });
		}
		const key = `${brand.toLowerCase()}|${model.toLowerCase()}|${yearStart ?? ""}|${yearEnd ?? ""}`;
		if (seen.has(key)) throw httpError("validation_error", "Kompatibilitas kendaraan duplikat", 400, requestId, { field: "compatibility" });
		seen.add(key);
		return { id: randomId("compat", 10), brand, model, year_start: yearStart, year_end: yearEnd };
	});
}

export async function sparePartsList(env, query) { return listSpareParts(env, query); }

export async function sparePartDetail(env, id, requestId) {
	const part = await getSparePart(env, id);
	if (!part) throw httpError("not_found", "Sparepart tidak ditemukan", 404, requestId);
	const [movements, compatibility, stockTrend] = await Promise.all([
		listMovements(env, id),
		listPartCompatibility(env, id),
		listStockTrend(env, id),
	]);
	return { ...part, movements, compatibility, stock_trend: stockTrend };
}

export async function sparePartCreate(env, body, auth, requestId) {
	const payload = partPayload(body, requestId);
	if (await findSparePartBySku(env, payload.sku)) throw httpError("conflict", "SKU sudah digunakan", 409, requestId);
	const stock = positiveInteger(body.stock ?? 0, "stock", requestId, { allowZero: true });
	const part = await insertSparePart(env, { id: randomId("part", 10), ...payload, stock });
	const compatibility = compatibilityPayload(body.compatibility, requestId);
	if (compatibility) await replacePartCompatibility(env, part.id, compatibility);
	await domainAudit(env, { event_type: "spare_part_created", user_id: auth.user.id, request_id: requestId, target_type: "spare_part", target_id: part.id });
	return { ...part, compatibility: compatibility || [] };
}

export async function sparePartUpdate(env, id, body, auth, requestId) {
	const current = await getSparePart(env, id);
	if (!current) throw httpError("not_found", "Sparepart tidak ditemukan", 404, requestId);
	const payload = partPayload(body, requestId, current);
	const duplicate = await findSparePartBySku(env, payload.sku);
	if (duplicate && duplicate.id !== id) throw httpError("conflict", "SKU sudah digunakan", 409, requestId);
	const part = await updateSparePart(env, id, payload);
	const compatibility = compatibilityPayload(body.compatibility, requestId);
	if (compatibility) await replacePartCompatibility(env, id, compatibility);
	await domainAudit(env, { event_type: "spare_part_updated", user_id: auth.user.id, request_id: requestId, target_type: "spare_part", target_id: part.id });
	return { ...part, compatibility: compatibility || await listPartCompatibility(env, id) };
}

export async function inventoryMovement(env, partId, body, auth, requestId, key) {
	const existing = await findMovementByIdempotency(env, key);
	if (existing) return { movement: existing, replayed: true };
	if (!await getSparePart(env, partId)) throw httpError("not_found", "Sparepart tidak ditemukan", 404, requestId);
	const type = enumValue(body.type, MOVEMENT_TYPES, "type", requestId);
	const quantity = positiveInteger(body.quantity, "quantity", requestId);
	const positive = ["stock_in", "adjustment_in", "return"].includes(type);
	let result;
	try {
		result = await applyMovement(env, {
			id: randomId("mov", 10), spare_part_id: partId, type,
			reference_type: optionalText(body.reference_type, 80), reference_id: optionalText(body.reference_id, 100),
			delta: positive ? quantity : -quantity, note: optionalText(body.note, 500), idempotency_key: key, created_by: auth.user.id,
		});
	} catch (error) {
		const concurrent = await findMovementByIdempotency(env, key);
		if (concurrent) return { movement: concurrent, replayed: true };
		throw error;
	}
	if (!result.changed) throw httpError("insufficient_stock", "Stok tidak mencukupi untuk mutasi ini", 409, requestId);
	await domainAudit(env, { event_type: "inventory_adjusted", user_id: auth.user.id, request_id: requestId, target_type: "spare_part", target_id: partId });
	return { movement: result.movement, replayed: false };
}

export async function suppliersList(env) { return listSuppliers(env); }

function supplierPayload(body, requestId, current = {}) {
	const email = optionalText(body.email ?? current.email, 160)?.toLowerCase() || null;
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw httpError("validation_error", "Format email supplier tidak valid", 400, requestId, { field: "email" });
	}
	return {
		name: requiredText(body.name ?? current.name, "name", requestId, 160),
		phone: optionalText(body.phone ?? current.phone, 40),
		email,
		address: optionalText(body.address ?? current.address, 500),
	};
}

export async function supplierCreate(env, body, auth, requestId) {
	const payload = supplierPayload(body, requestId);
	if (await findSupplierByName(env, payload.name)) throw httpError("conflict", "Nama supplier sudah digunakan", 409, requestId, { field: "name" });
	const supplier = await insertSupplier(env, { id: randomId("sup", 10), ...payload });
	await domainAudit(env, { event_type: "supplier_created", user_id: auth.user.id, request_id: requestId, target_type: "supplier", target_id: supplier.id });
	return supplier;
}

export async function supplierUpdate(env, id, body, auth, requestId) {
	const current = await getSupplier(env, id);
	if (!current) throw httpError("not_found", "Supplier tidak ditemukan", 404, requestId);
	const payload = supplierPayload(body, requestId, current);
	const duplicate = await findSupplierByName(env, payload.name);
	if (duplicate && duplicate.id !== id) throw httpError("conflict", "Nama supplier sudah digunakan", 409, requestId, { field: "name" });
	const supplier = await updateSupplier(env, id, payload);
	await domainAudit(env, { event_type: "supplier_updated", user_id: auth.user.id, request_id: requestId, target_type: "supplier", target_id: supplier.id });
	return supplier;
}

export async function stockReceiptsList(env, query) { return listStockReceipts(env, query); }

export async function stockReceiptDetail(env, id, requestId) {
	const receipt = await getStockReceipt(env, id);
	if (!receipt) throw httpError("not_found", "Penerimaan stok tidak ditemukan", 404, requestId);
	return receipt;
}

export async function stockReceiptCreate(env, body, auth, requestId, key) {
	const existing = await findReceiptByIdempotency(env, key);
	if (existing) return { receipt: await getStockReceipt(env, existing.id), replayed: true };
	const supplierId = requiredText(body.supplier_id, "supplier_id", requestId, 80);
	if (!await getSupplier(env, supplierId)) throw httpError("not_found", "Supplier tidak ditemukan", 404, requestId);
	if (!Array.isArray(body.items) || body.items.length === 0) throw httpError("validation_error", "Minimal satu item stok wajib diisi", 400, requestId, { field: "items" });
	if (body.items.length > 100) throw httpError("validation_error", "Maksimal 100 item per penerimaan", 400, requestId, { field: "items" });
	const seen = new Set();
	const items = [];
	for (const raw of body.items) {
		const partId = requiredText(raw.spare_part_id, "spare_part_id", requestId, 80);
		if (seen.has(partId)) throw httpError("validation_error", "Sparepart duplikat dalam dokumen", 400, requestId);
		seen.add(partId);
		if (!await getSparePart(env, partId)) throw httpError("not_found", "Salah satu sparepart tidak ditemukan", 404, requestId, { spare_part_id: partId });
		const quantity = positiveInteger(raw.quantity, "quantity", requestId);
		const unitCost = positiveInteger(raw.unit_cost, "unit_cost", requestId, { allowZero: true });
		items.push({ id: randomId("sri", 10), movement_id: randomId("mov", 10), spare_part_id: partId, quantity, unit_cost: unitCost, subtotal: quantity * unitCost });
	}
	const id = randomId("sr", 10);
	try {
		const receipt = await createStockReceipt(env, {
			id, receipt_no: `STK-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomDigits(4)}`,
			supplier_id: supplierId, received_at: isoDateTime(body.received_at || new Date().toISOString(), "received_at", requestId),
			supplier_document_no: optionalText(body.supplier_document_no, 120), note: optionalText(body.note, 500),
				total_amount: items.reduce((sum, item) => sum + item.subtotal, 0), idempotency_key: key, created_by: auth.user.id,
		}, items);
		await domainAudit(env, { event_type: "stock_receipt_created", user_id: auth.user.id, request_id: requestId, target_type: "stock_receipt", target_id: receipt.id });
		return { receipt, replayed: false };
	} catch (error) {
		const concurrent = await findReceiptByIdempotency(env, key);
		if (concurrent) return { receipt: await getStockReceipt(env, concurrent.id), replayed: true };
		throw error;
	}
}

export async function servicePartAdd(env, serviceOrderId, body, auth, requestId, key) {
	const order = await getServiceOrder(env, serviceOrderId);
	if (!order) throw httpError("not_found", "Service Order tidak ditemukan", 404, requestId);
	if (auth.roles.includes("mechanic") && !auth.roles.includes("admin")) {
		const mechanic = await getMechanicByUser(env, auth.user.id);
		if (!mechanic || order.mechanic_id !== mechanic.id) throw httpError("forbidden", "Service Order ini tidak ditugaskan kepada Anda", 403, requestId);
	}
	if (["completed", "cancelled"].includes(order.status)) throw httpError("invalid_transition", "Service Order tidak dapat diubah", 409, requestId);
	const partId = requiredText(body.spare_part_id, "spare_part_id", requestId, 80);
	const part = await getSparePart(env, partId);
	if (!part) throw httpError("not_found", "Sparepart tidak ditemukan", 404, requestId);
	const quantity = positiveInteger(body.quantity, "quantity", requestId);
	if (part.stock < quantity) throw httpError("insufficient_stock", "Stok sparepart tidak mencukupi", 409, requestId);
	try {
		const item = await addServicePart(env, {
			id: randomId("sop", 10), movement_id: randomId("mov", 10), service_order_id: serviceOrderId,
			spare_part_id: partId, quantity, unit_price: part.selling_price, idempotency_key: key, created_by: auth.user.id,
		});
		if (!item) throw httpError("insufficient_stock", "Stok sparepart tidak mencukupi", 409, requestId);
		await domainAudit(env, { event_type: "service_part_consumed", user_id: auth.user.id, request_id: requestId, target_type: "service_order", target_id: serviceOrderId });
		return { item, replayed: false };
	} catch (error) {
		const existing = await findMovementByIdempotency(env, key);
		if (existing) return { movement: existing, replayed: true };
		throw error;
	}
}
