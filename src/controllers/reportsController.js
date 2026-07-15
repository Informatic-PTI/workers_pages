import { appDb } from "../lib/bindings.js";
import { requireAppAuth } from "../middlewares/appAuth.js";
import { ok } from "../lib/response.js";
import { pagination } from "../lib/validation.js";
import { reportAnalytics } from "../services/reportsService.js";

const ACTIVITY_LABELS = {
	login_password_failed: "Login gagal",
	login_password_success: "Login berhasil",
	logout: "Keluar dari sistem",
	logout_all: "Mengakhiri semua sesi",
	booking_created: "Membuat booking",
	booking_checked_in: "Check-in booking",
	service_status_changed: "Mengubah status Service Order",
	service_mechanic_assigned: "Menetapkan mekanik Service Order",
	service_task_created: "Menambahkan tugas service",
	service_task_completed: "Menyelesaikan tugas service",
	inventory_adjusted: "Menyesuaikan stok sparepart",
	stock_receipt_created: "Menerima stok masuk",
	service_part_consumed: "Menggunakan sparepart untuk service",
	invoice_created: "Membuat invoice",
	payment_processed: "Memproses pembayaran",
	attachment_uploaded: "Mengunggah lampiran",
};

export async function analyticsController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "report:read" });
	const url = new URL(request.url);
	return ok({ report: await reportAnalytics(env, url.searchParams.get("from"), url.searchParams.get("to"), requestId) }, requestId);
}

export async function activityController(request, env, _ctx, requestId) {
	await requireAppAuth(request, env, requestId, { roles: ["admin"], permission: "report:read" });
	const url = new URL(request.url);
	const { limit, page, offset } = pagination(url);
	const q = String(url.searchParams.get("q") || "").trim();
	const term = `%${q}%`;
	const db = appDb(env);
	const [rows, count] = await Promise.all([
		db.prepare(
			`SELECT id,event_type,severity,user_id,target_type,target_id,outcome,reason_code,created_at
			 FROM audit_events WHERE event_type LIKE ? OR COALESCE(target_id,'') LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
		).bind(term, term, limit, offset).all(),
		db.prepare("SELECT COUNT(*) AS total FROM audit_events WHERE event_type LIKE ? OR COALESCE(target_id,'') LIKE ?").bind(term, term).first(),
	]);
	const items = (rows.results || []).map((row) => ({
		...row,
		event_code: row.event_type,
		event_type: ACTIVITY_LABELS[row.event_type] || row.event_type.replaceAll("_", " "),
	}));
	return ok({ items, total: Number(count?.total || 0), page, limit }, requestId);
}
