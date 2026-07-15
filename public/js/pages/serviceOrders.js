import { api } from "../api/client.js";
import { currentRoles, currentUser } from "../state/session.js";
import { confirmDialog, dateTime, emptyState, escapeHtml, formDataObject, money, pageHeader, status, toast } from "../components/ui.js";
import { navigate } from "../router.js";

const STEPS = ["waiting", "inspection", "approval", "in_progress", "quality_check", "ready", "completed"];
const NEXT = { waiting: "inspection", inspection: "approval", approval: "in_progress", in_progress: "quality_check", quality_check: "ready", ready: "completed" };
const NEXT_LABEL = { inspection: "Mulai Pemeriksaan", approval: "Minta Persetujuan", in_progress: "Mulai Pengerjaan", quality_check: "Kirim ke Quality Check", ready: "Tandai Siap Diambil", completed: "Selesaikan Service" };

function orderRows(items) {
	return items.map((item) => `<tr><td><a class="cell-main" href="#/service-orders/${encodeURIComponent(item.id)}">${escapeHtml(item.order_no)}</a><span class="cell-sub">${dateTime(item.created_at)}</span></td><td><span class="cell-main">${escapeHtml(`${item.brand} ${item.model}`)}</span><span class="cell-sub">${escapeHtml(item.license_plate)}</span></td><td>${escapeHtml(item.customer_name)}</td><td>${escapeHtml(item.mechanic_name || "Belum ditugaskan")}</td><td>${status(item.status)}</td><td>${item.invoice_no ? `<span class="cell-main money">${money(item.invoice_total)}</span><span class="cell-sub">${status(item.invoice_status)}</span>` : "—"}</td></tr>`).join("");
}

export const serviceOrdersPage = {
	active: "service-orders",
	async load(route) {
		const params = new URLSearchParams({ limit: "50" });
		if (route.query.q) params.set("q", route.query.q); if (route.query.status) params.set("status", route.query.status);
		return api.get(`/service-orders?${params}`);
	},
	render(data, route) {
		const items = data.items || [];
		return `${pageHeader("Service Order", "Pantau kendaraan dari check-in sampai selesai")}
			<div class="toolbar"><div class="input-icon"><span>⌕</span><input class="input" id="order-search" value="${escapeHtml(route.query.q || "")}" placeholder="Cari SO, pelanggan, atau plat…"></div><select class="select" id="order-status" style="width:auto"><option value="">Semua status</option>${STEPS.map((value) => `<option value="${value}" ${route.query.status === value ? "selected" : ""}>${value.replaceAll("_", " ")}</option>`).join("")}</select></div>
			<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Service Order</th><th>Kendaraan</th><th>Pelanggan</th><th>Mekanik</th><th>Status</th><th>Invoice</th></tr></thead><tbody>${orderRows(items)}</tbody></table></div><div class="mobile-records">${items.map((item) => `<a class="record-card" style="display:block" href="#/service-orders/${encodeURIComponent(item.id)}"><div class="record-top"><strong>${escapeHtml(item.order_no)}</strong>${status(item.status)}</div><span class="cell-sub">${escapeHtml(`${item.brand} ${item.model} · ${item.license_plate}`)}</span><div class="record-meta"><span>${escapeHtml(item.customer_name)}</span><span>${escapeHtml(item.mechanic_name || "Belum ditugaskan")}</span></div></a>`).join("")}</div>` : emptyState("Belum ada Service Order", "Check-in booking untuk membuat Service Order.")}</section>`;
	},
	mount() {
		const apply = () => { const q = document.querySelector("#order-search")?.value.trim(); const statusValue = document.querySelector("#order-status")?.value; const params = new URLSearchParams(); if (q) params.set("q", q); if (statusValue) params.set("status", statusValue); navigate(`/service-orders${params.size ? `?${params}` : ""}`); };
		document.querySelector("#order-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") apply(); });
		document.querySelector("#order-status")?.addEventListener("change", apply);
	},
};

function stepper(current) {
	const currentIndex = STEPS.indexOf(current);
	return `<div class="stepper">${STEPS.map((step, index) => `<div class="step ${index < currentIndex ? "done" : index === currentIndex ? "active" : ""}"><span class="step-dot">${index < currentIndex ? "✓" : index + 1}</span><span>${escapeHtml(step.replaceAll("_", " "))}</span></div>`).join("")}</div>`;
}

function taskList(tasks) {
	return tasks.length ? `<div class="task-list">${tasks.map((task) => `<div class="task ${task.status === "completed" ? "completed" : ""}"><button class="task-check" ${task.status === "completed" ? "disabled" : `data-complete-task="${escapeHtml(task.id)}"`} aria-label="Selesaikan tugas">✓</button><div style="flex:1"><strong class="task-name">${escapeHtml(task.name)}</strong><span class="cell-sub">${escapeHtml(task.description || "")}</span></div>${status(task.status)}</div>`).join("")}</div>` : emptyState("Belum ada tugas", "Tambahkan pekerjaan untuk mekanik.") ;
}

function taskDialog() {
	return `<dialog class="modal" id="task-dialog"><form id="task-form"><div class="modal-header"><h2>Tambah Tugas Service</h2><button class="icon-btn" type="button" data-close>×</button></div><div class="modal-body form-grid"><div class="field field-full"><label>Nama Tugas *</label><input class="input" name="name" maxlength="160" required></div><div class="field field-full"><label>Deskripsi</label><textarea class="textarea" name="description"></textarea></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Tambah Tugas</button></div></form></dialog>`;
}

function partDialog(parts) {
	return `<dialog class="modal" id="part-dialog"><form id="part-form"><div class="modal-header"><h2>Tambah Sparepart</h2><button class="icon-btn" type="button" data-close>×</button></div><div class="modal-body form-grid"><div class="field field-full"><label>Sparepart *</label><select class="select" name="spare_part_id" required><option value="">Pilih sparepart</option>${parts.map((part) => `<option value="${escapeHtml(part.id)}">${escapeHtml(part.name)} · ${escapeHtml(part.sku)} · stok ${part.stock}</option>`).join("")}</select></div><div class="field"><label>Jumlah *</label><input class="input" name="quantity" type="number" min="1" value="1" required></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Gunakan Sparepart</button></div></form></dialog>`;
}

function assignmentDialog(mechanics, currentId) {
	return `<dialog class="modal" id="assignment-dialog"><form id="assignment-form"><div class="modal-header"><h2>Tetapkan Mekanik</h2><button class="icon-btn" type="button" data-close>×</button></div><div class="modal-body"><div class="field"><label>Mekanik *</label><select class="select" name="mechanic_id" required><option value="">Pilih mekanik</option>${mechanics.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === currentId ? "selected" : ""}>${escapeHtml(item.name)} · ${escapeHtml(item.specialty || "Mekanik umum")}</option>`).join("")}</select></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Simpan Penugasan</button></div></form></dialog>`;
}

function invoiceDialog() {
	return `<dialog class="modal" id="invoice-dialog"><form id="invoice-form"><div class="modal-header"><div><h2>Buat Invoice</h2><span class="cell-sub">Nilai sparepart akan dihitung otomatis.</span></div><button class="icon-btn" type="button" data-close aria-label="Tutup">&times;</button></div><div class="modal-body form-grid"><div class="field"><label>Biaya Jasa *</label><input class="input" name="labor_amount" type="number" min="0" value="150000" required></div><div class="field"><label>Diskon</label><input class="input" name="discount" type="number" min="0" value="0"></div><div class="field"><label>Pajak / Biaya Tambahan</label><input class="input" name="tax" type="number" min="0" value="0"></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Buat Invoice</button></div></form></dialog>`;
}

export const serviceOrderDetailPage = {
	active: "service-orders",
	async load(route) {
		const isAdmin = currentRoles().some((role) => ["admin", "hyperuser"].includes(role));
		const [order, parts, mechanics] = await Promise.all([
			api.get(`/service-orders/${encodeURIComponent(route.params.id)}`),
			api.get("/spare-parts?limit=100"),
			isAdmin ? api.get("/mechanics") : Promise.resolve({ items: [] }),
		]);
		return { order: order.service_order, parts: parts.items || [], mechanics: mechanics.items || [] };
	},
	render({ order, parts, mechanics }) {
		const next = NEXT[order.status];
		const isAdmin = currentRoles().some((role) => ["admin", "hyperuser"].includes(role));
		return `${pageHeader(order.order_no, `${order.brand} ${order.model} (${order.license_plate}) · ${order.customer_name}`, '<a class="btn btn-secondary" href="#/service-orders">← Kembali</a>')}
			<section class="card" style="margin-bottom:20px"><div class="card-body">${stepper(order.status)}</div></section>
			<div class="detail-grid"><div class="grid">
				<section class="card attention-card"><div class="card-body"><small>Keluhan Pelanggan</small><h2 style="margin-top:6px">“${escapeHtml(order.complaint)}”</h2>${order.inspection_notes ? `<p class="cell-sub" style="margin-top:10px">Hasil pemeriksaan: ${escapeHtml(order.inspection_notes)}</p>` : ""}</div></section>
				<section class="card"><div class="card-header"><h2>Tugas Service</h2><button class="btn btn-secondary btn-sm" id="add-task">＋ Tambah Tugas</button></div>${taskList(order.tasks || [])}</section>
				<section class="card"><div class="card-header"><h2>Sparepart Digunakan</h2><button class="btn btn-secondary btn-sm" id="add-part">＋ Tambah Sparepart</button></div>${order.parts?.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Sparepart</th><th>SKU</th><th>Qty</th><th>Harga</th><th>Status</th></tr></thead><tbody>${order.parts.map((part) => `<tr><td class="cell-main">${escapeHtml(part.name)}</td><td>${escapeHtml(part.sku)}</td><td>${Number(part.quantity)}</td><td>${money(part.unit_price)}</td><td>${status(part.status)}</td></tr>`).join("")}</tbody></table></div>` : emptyState("Belum ada sparepart")}</section>
			</div><aside class="grid sticky-panel">
				<section class="card"><div class="card-header"><h2>Status Eksekusi</h2>${status(order.status)}</div><div class="card-body"><small>Mekanik Ditugaskan</small><h2 style="margin:5px 0 18px">${escapeHtml(order.mechanic_name || "Belum ditugaskan")}</h2><div class="grid">${isAdmin && !["completed", "cancelled"].includes(order.status) ? '<button class="btn btn-secondary" id="assign-mechanic">Tetapkan Mekanik</button>' : ""}${next ? `<button class="btn" id="advance-order" data-next="${next}">${escapeHtml(NEXT_LABEL[next])}</button>` : ""}${isAdmin && !order.invoice_id && ["quality_check", "ready", "completed"].includes(order.status) ? '<button class="btn btn-secondary" id="create-invoice">Buat Invoice</button>' : ""}${order.invoice_id ? `<a class="btn btn-secondary" href="#/cashier/${encodeURIComponent(order.invoice_id)}">${escapeHtml(order.invoice_no)} · ${money(order.invoice_total)}</a>` : ""}</div></div></section>
				<section class="card"><div class="card-header"><h2>Aktivitas Terbaru</h2></div>${order.activities?.length ? `<div class="attention-list">${order.activities.slice(0, 6).map((activity) => `<div class="attention-item"><span class="attention-dot">•</span><div><strong>${escapeHtml(activity.description)}</strong><span class="cell-sub">${dateTime(activity.created_at)}</span></div></div>`).join("")}</div>` : emptyState("Belum ada aktivitas")}</section>
			</aside></div><div class="sticky-mobile-action">${next ? `<button class="btn" data-mobile-advance="${next}">${escapeHtml(NEXT_LABEL[next])}</button>` : '<a class="btn" href="#/service-orders">Kembali ke Daftar</a>'}</div>${taskDialog()}${partDialog(parts)}${assignmentDialog(mechanics, order.mechanic_id)}${invoiceDialog()}`;
	},
	mount({ order }) {
		const reload = () => location.reload();
		const transition = async (next) => {
			if (!await confirmDialog({ title: "Perbarui status", message: `Ubah status ${order.order_no} ke ${NEXT_LABEL[next] || next}?`, confirmText: NEXT_LABEL[next] || "Perbarui" })) return;
			try { await api.post(`/service-orders/${encodeURIComponent(order.id)}/transition`, { status: next }); toast("Status berhasil diperbarui", "success"); reload(); } catch (error) { toast(error.message, "error"); }
		};
		document.querySelector("#advance-order")?.addEventListener("click", (event) => transition(event.currentTarget.dataset.next));
		document.querySelector("[data-mobile-advance]")?.addEventListener("click", (event) => transition(event.currentTarget.dataset.mobileAdvance));
		document.querySelectorAll("[data-complete-task]").forEach((button) => button.addEventListener("click", async () => { button.disabled = true; try { await api.post(`/tasks/${encodeURIComponent(button.dataset.completeTask)}/complete`); toast("Tugas diselesaikan", "success"); reload(); } catch (error) { toast(error.message, "error"); button.disabled = false; } }));
		const taskDialogElement = document.querySelector("#task-dialog"); const partDialogElement = document.querySelector("#part-dialog");
		document.querySelector("#add-task")?.addEventListener("click", () => taskDialogElement.showModal());
		document.querySelector("#add-part")?.addEventListener("click", () => partDialogElement.showModal());
		document.querySelector("#assign-mechanic")?.addEventListener("click", () => document.querySelector("#assignment-dialog")?.showModal());
		document.querySelectorAll("dialog [data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
		document.querySelector("#task-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { await api.post(`/service-orders/${encodeURIComponent(order.id)}/tasks`, formDataObject(event.target)); toast("Tugas ditambahkan", "success"); reload(); } catch (error) { toast(error.message, "error"); } });
		document.querySelector("#part-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { await api.post(`/service-orders/${encodeURIComponent(order.id)}/parts`, formDataObject(event.target), { idempotent: true }); toast("Sparepart dialokasikan", "success"); reload(); } catch (error) { toast(error.message, "error"); } });
		document.querySelector("#assignment-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const button = event.target.querySelector("button[type=submit]"); button.disabled = true; try { await api.patch(`/service-orders/${encodeURIComponent(order.id)}/assignment`, formDataObject(event.target)); toast("Mekanik berhasil ditetapkan", "success"); reload(); } catch (error) { toast(error.message, "error"); button.disabled = false; } });
		const invoiceDialogElement = document.querySelector("#invoice-dialog");
		document.querySelector("#create-invoice")?.addEventListener("click", () => invoiceDialogElement?.showModal());
		document.querySelector("#invoice-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const data = formDataObject(event.target); const button = event.target.querySelector("button[type=submit]"); button.disabled = true; try { const result = await api.post(`/service-orders/${encodeURIComponent(order.id)}/invoice`, { labor_amount: Number(data.labor_amount), discount: Number(data.discount || 0), tax: Number(data.tax || 0) }, { idempotent: true }); toast("Invoice dibuat", "success"); invoiceDialogElement.close(); navigate(`/cashier/${result.invoice.id}`); } catch (error) { toast(error.message, "error"); button.disabled = false; } });
	},
};

export const myWorkPage = {
	active: "my-work",
	async load() { return api.get("/service-orders?limit=30"); },
	render(data) {
		const items = data.items || []; const active = items.find((item) => item.status === "in_progress") || items[0];
		return `${pageHeader(`Selamat bekerja, ${currentUser()?.display_name || "Mekanik"}`, "Fokus pada pekerjaan aktif dan antrean berikutnya")}
			${active ? `<div class="detail-grid"><section class="card"><div class="card-header"><div><small>Pekerjaan Aktif</small><h2>${escapeHtml(active.order_no)}</h2></div>${status(active.status)}</div><div class="card-body"><h1>${escapeHtml(`${active.brand} ${active.model}`)}</h1><p class="cell-sub">${escapeHtml(active.license_plate)} · ${escapeHtml(active.customer_name)}</p><div class="alert" style="margin-top:18px"><div><strong>Keluhan</strong><p>${escapeHtml(active.complaint)}</p></div></div><a class="btn" style="margin-top:18px" href="#/service-orders/${encodeURIComponent(active.id)}">Buka Pekerjaan</a></div></section><aside class="card"><div class="card-header"><h2>Antrean Selanjutnya</h2></div>${items.filter((item) => item.id !== active.id).length ? `<div class="attention-list">${items.filter((item) => item.id !== active.id).slice(0, 5).map((item) => `<a class="attention-item" href="#/service-orders/${encodeURIComponent(item.id)}"><span class="attention-dot">SO</span><div><strong>${escapeHtml(`${item.brand} ${item.model}`)}</strong><span class="cell-sub">${escapeHtml(item.order_no)} · ${status(item.status)}</span></div></a>`).join("")}</div>` : emptyState("Antrean kosong")}</aside></div>` : emptyState("Tidak ada pekerjaan", "Anda belum memiliki Service Order aktif.")}`;
	},
};
