import { beforeAll, describe, expect, it } from "vitest";
import { env } from "cloudflare:test";
import { customerCreate, vehicleCreate } from "../src/services/customersService.js";
import { bookingCheckIn, bookingCreate, bookingStatusUpdate, mechanicCreate, mechanicUpdate, serviceOrderTransition, taskComplete } from "../src/services/workshopService.js";
import {
	inventoryMovement, sparePartCreate, sparePartDetail, sparePartUpdate, stockReceiptCreate,
	stockReceiptsList, supplierCreate, supplierUpdate,
} from "../src/services/inventoryService.js";
import { paymentCreate } from "../src/services/billingService.js";
import { notificationRead } from "../src/services/notificationsService.js";
import { requireAppAuth } from "../src/middlewares/appAuth.js";
import { signAccessToken } from "../src/lib/jwt.js";
import { attachmentDownload, attachmentUpload } from "../src/services/attachmentsService.js";

const adminAuth = { user: { id: "test_admin", is_hyperuser: true }, roles: ["admin", "hyperuser"] };
const cashierAuth = { user: { id: "test_cash", is_hyperuser: false }, roles: ["cashier"] };

async function seed(db) {
	await db.batch([
		db.prepare("INSERT OR IGNORE INTO users (id,username,display_name,status,is_hyperuser) VALUES ('test_admin','testadmin','Test Admin','active',1)"),
		db.prepare("INSERT OR IGNORE INTO users (id,username,display_name,status,is_hyperuser) VALUES ('test_cash','testcash','Test Cashier','active',0)"),
		db.prepare("INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES ('test_admin','role_admin')"),
		db.prepare("INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES ('test_cash','role_cashier')"),
		db.prepare("INSERT OR IGNORE INTO customers (id,name,phone,status) VALUES ('cus_base','Base Customer','628111111111','active')"),
		db.prepare("INSERT OR IGNORE INTO customers (id,name,phone,status) VALUES ('cus_other','Other Customer','628122222222','active')"),
		db.prepare("INSERT OR IGNORE INTO vehicles (id,customer_id,brand,model,license_plate,odometer) VALUES ('veh_base','cus_base','Honda','Vario','B 1111 TST',1000)"),
		db.prepare("INSERT OR IGNORE INTO bookings (id,booking_no,customer_id,vehicle_id,scheduled_at,complaint,status,idempotency_key,created_by) VALUES ('bkg_cancel','BK-CANCEL','cus_base','veh_base',datetime('now','+1 day'),'Test complaint','cancelled','seed-cancel','test_admin')"),
		db.prepare("INSERT OR IGNORE INTO service_orders (id,order_no,customer_id,vehicle_id,complaint,status,created_by) VALUES ('so_test','SO-TEST-001','cus_base','veh_base','Workflow test','waiting','test_admin')"),
		db.prepare("INSERT OR IGNORE INTO service_tasks (id,service_order_id,name,status) VALUES ('task_test','so_test','Test task','pending')"),
		db.prepare("INSERT OR IGNORE INTO spare_parts (id,sku,name,category,purchase_price,selling_price,stock,minimum_stock,critical_stock,status) VALUES ('part_test','PART-TEST','Test Part','Test',10000,15000,10,3,1,'active')"),
		db.prepare("INSERT OR IGNORE INTO suppliers (id,name) VALUES ('sup_test','Test Supplier')"),
		db.prepare("INSERT OR IGNORE INTO service_orders (id,order_no,customer_id,vehicle_id,complaint,status,created_by) VALUES ('so_invoice','SO-INV-001','cus_base','veh_base','Invoice test','ready','test_admin')"),
		db.prepare("INSERT OR IGNORE INTO invoices (id,invoice_no,service_order_id,subtotal,total,status) VALUES ('inv_test','INV-TEST-001','so_invoice',100000,100000,'unpaid')"),
		db.prepare("INSERT OR IGNORE INTO notifications (id,role_key,type,title,message,severity) VALUES ('not_test','cashier','test','Test notification','Please read','info')"),
		db.prepare("INSERT OR IGNORE INTO sessions (id,user_id,status,expires_at) VALUES ('sess_cash','test_cash','active',datetime('now','+1 day'))"),
	]);
}

beforeAll(async () => {
	await seed(env.DB);
	await seed(env.AUTH_DB);
});

describe("workshop domain rules", () => {
	it("detects duplicate customers and license plates", async () => {
		await expect(customerCreate(env, { name: "Duplicate", phone: "08111111111" }, "req-test"))
			.rejects.toMatchObject({ code: "customer_duplicate", status: 409 });
		await expect(vehicleCreate(env, { customer_id: "cus_base", brand: "Honda", model: "Beat", license_plate: "B 1111 TST", odometer: 0 }, "req-test"))
			.rejects.toMatchObject({ code: "vehicle_duplicate", status: 409 });
	});

	it("creates a booking and makes booking creation and check-in idempotent", async () => {
		const body = { customer_id: "cus_base", vehicle_id: "veh_base", scheduled_at: new Date(Date.now() + 86400000).toISOString(), complaint: "Booking test" };
		const first = await bookingCreate(env, body, adminAuth, "req-booking", "idem-booking");
		const replay = await bookingCreate(env, body, adminAuth, "req-booking-2", "idem-booking");
		expect(first.replayed).toBe(false);
		expect(replay.replayed).toBe(true);
		expect(replay.booking.id).toBe(first.booking.id);
		const checkedIn = await bookingCheckIn(env, first.booking.id, {}, adminAuth, "req-checkin");
		const checkedInReplay = await bookingCheckIn(env, first.booking.id, {}, adminAuth, "req-checkin-2");
		expect(checkedIn.replayed).toBe(false);
		expect(checkedInReplay.replayed).toBe(true);
		expect(checkedInReplay.service_order.id).toBe(checkedIn.service_order.id);
	});

	it("rejects invalid booking and service workflow transitions", async () => {
		await expect(bookingStatusUpdate(env, "bkg_cancel", { status: "confirmed" }, "req-invalid"))
			.rejects.toMatchObject({ code: "invalid_transition", status: 409 });
		await expect(serviceOrderTransition(env, "so_test", { status: "completed" }, adminAuth, "req-invalid"))
			.rejects.toMatchObject({ code: "invalid_transition", status: 409 });
		const moved = await serviceOrderTransition(env, "so_test", { status: "inspection" }, adminAuth, "req-valid");
		expect(moved.service_order.status).toBe("inspection");
	});

	it("completes service tasks safely when repeated", async () => {
		const first = await taskComplete(env, "task_test", adminAuth, "req-task");
		const replay = await taskComplete(env, "task_test", adminAuth, "req-task-2");
		expect(first.replayed).toBe(false);
		expect(replay.replayed).toBe(true);
		expect(replay.task.status).toBe("completed");
	});

	it("audits inventory movement and rejects negative stock", async () => {
		const first = await inventoryMovement(env, "part_test", { type: "adjustment_out", quantity: 4 }, adminAuth, "req-move", "idem-move");
		const replay = await inventoryMovement(env, "part_test", { type: "adjustment_out", quantity: 4 }, adminAuth, "req-move-2", "idem-move");
		expect(first.movement.quantity_after).toBe(6);
		expect(replay.replayed).toBe(true);
		await expect(inventoryMovement(env, "part_test", { type: "adjustment_out", quantity: 99 }, adminAuth, "req-move-3", "idem-overdraw"))
			.rejects.toMatchObject({ code: "insufficient_stock", status: 409 });
	});

	it("posts stock receipts only once", async () => {
		const before = await env.DB.prepare("SELECT stock FROM spare_parts WHERE id='part_test'").first();
		const body = { supplier_id: "sup_test", received_at: new Date().toISOString(), items: [{ spare_part_id: "part_test", quantity: 5, unit_cost: 12000 }] };
		const first = await stockReceiptCreate(env, body, adminAuth, "req-receipt", "idem-receipt");
		const replay = await stockReceiptCreate(env, body, adminAuth, "req-receipt-2", "idem-receipt");
		expect(first.replayed).toBe(false);
		expect(replay.replayed).toBe(true);
		const part = await env.DB.prepare("SELECT stock FROM spare_parts WHERE id='part_test'").first();
		expect(part.stock).toBe(before.stock + 5);
	});

	it("creates and updates operational mechanics", async () => {
		const mechanic = await mechanicCreate(env, { name: "Danu Setiawan", phone: "6281311112222", specialty: "Injeksi", status: "available" }, adminAuth, "req-mechanic-create");
		expect(mechanic.name).toBe("Danu Setiawan");
		const updated = await mechanicUpdate(env, mechanic.id, { specialty: "Injeksi dan kelistrikan", status: "busy" }, adminAuth, "req-mechanic-update");
		expect(updated.status).toBe("busy");
		expect(updated.specialty).toContain("kelistrikan");
	});

	it("creates and updates suppliers", async () => {
		const supplier = await supplierCreate(env, { name: "PT Suku Cadang Nusantara", phone: "0215550101", email: "sales@example.test" }, adminAuth, "req-supplier-create");
		expect(supplier.name).toContain("Nusantara");
		const updated = await supplierUpdate(env, supplier.id, { address: "Jakarta Timur" }, adminAuth, "req-supplier-update");
		expect(updated.address).toBe("Jakarta Timur");
	});

	it("covers sparepart master fields and vehicle compatibility", async () => {
		const part = await sparePartCreate(env, {
			sku: "TEST-CVT-001", name: "V-Belt Test Genuine", category: "CVT", purchase_price: 100000,
			selling_price: 145000, stock: 3, minimum_stock: 2, critical_stock: 1, location: "Rak T-01",
			compatibility: [{ brand: "Honda", model: "Vario 125", year_start: 2018, year_end: 2024 }],
		}, adminAuth, "req-part-create");
		expect(part.compatibility).toHaveLength(1);
		await sparePartUpdate(env, part.id, {
			location: "Rak T-02", compatibility: [
				{ brand: "Honda", model: "Vario 125", year_start: 2018, year_end: 2024 },
				{ brand: "Honda", model: "Vario 150", year_start: 2018, year_end: 2021 },
			],
		}, adminAuth, "req-part-update");
		const detail = await sparePartDetail(env, part.id, "req-part-detail");
		expect(detail.location).toBe("Rak T-02");
		expect(detail.compatibility).toHaveLength(2);
	});

	it("lists stock receipt history for the inventory frontend", async () => {
		const result = await stockReceiptsList(env, { q: "Test Supplier", supplierId: "", limit: 20, offset: 0 });
		expect(result.total).toBeGreaterThanOrEqual(1);
		expect(result.items[0]).toHaveProperty("item_count");
	});

	it("validates cash and prevents duplicate payments", async () => {
		await expect(paymentCreate(env, "inv_test", { method: "qris" }, cashierAuth, "req-pay-qris", "idem-pay-qris"))
			.rejects.toMatchObject({ code: "provider_not_configured", status: 503 });
		await expect(paymentCreate(env, "inv_test", { method: "cash", cash_received: 50000 }, cashierAuth, "req-pay-low", "idem-pay-low"))
			.rejects.toMatchObject({ code: "insufficient_cash", status: 400 });
		const paid = await paymentCreate(env, "inv_test", { method: "cash", cash_received: 120000 }, cashierAuth, "req-pay", "idem-pay");
		expect(paid.payment.change_amount).toBe(20000);
		const replay = await paymentCreate(env, "inv_test", { method: "cash", cash_received: 120000 }, cashierAuth, "req-pay-replay", "idem-pay");
		expect(replay.replayed).toBe(true);
		await expect(paymentCreate(env, "inv_test", { method: "cash", cash_received: 120000 }, cashierAuth, "req-pay-duplicate", "idem-pay-other"))
			.rejects.toMatchObject({ code: "already_paid", status: 409 });
	});

	it("marks notifications read idempotently", async () => {
		const auth = { user: { id: "test_cash" }, roles: ["cashier"] };
		const first = await notificationRead(env, "not_test", auth);
		const replay = await notificationRead(env, "not_test", auth);
		expect(first.read_at).toBeTruthy();
		expect(replay.read_at).toBe(first.read_at);
	});

	it("enforces backend role authorization", async () => {
		const user = { id: "test_cash", status: "active", is_hyperuser: 0 };
		const token = await signAccessToken(env, { user, sessionId: "sess_cash", ttlSeconds: 300 });
		const request = new Request("https://test.example/api/v1/spare-parts", { headers: { authorization: `Bearer ${token}` } });
		const allowed = await requireAppAuth(request, env, "req-auth", { roles: ["cashier"], permission: "workshop:read" });
		expect(allowed.roles).toContain("cashier");
		await expect(requireAppAuth(request, env, "req-auth-denied", { roles: ["admin"], permission: "inventory:manage" }))
			.rejects.toMatchObject({ code: "forbidden", status: 403 });
	});

	it("reports attachment storage as unavailable when R2 is disabled", async () => {
		const request = new Request("https://test.example/api/v1/attachments", { method: "POST", body: "file" });
		await expect(attachmentUpload(env, request, adminAuth, "req-upload-disabled"))
			.rejects.toMatchObject({ code: "provider_not_configured", status: 503 });
		await expect(attachmentDownload(env, "missing", "req-download-disabled", adminAuth))
			.rejects.toMatchObject({ code: "provider_not_configured", status: 503 });
	});
});
