import { api } from "../api/client.js";
import { dateTime, emptyState, escapeHtml, formDataObject, money, pageHeader, status, toast } from "../components/ui.js";
import { navigate } from "../router.js";

export const cashierPage = {
	active: "cashier",
	async load(route) { return api.get(`/invoices?limit=50&status=${encodeURIComponent(route.query.status || "unpaid")}`); },
	render(data, route) {
		const items = data.items || [];
		return `${pageHeader("Kasir / POS", "Antrean pembayaran invoice service")}
			<div class="tabs" style="margin-bottom:16px"><a class="tab ${!route.query.status || route.query.status === "unpaid" ? "active" : ""}" href="#/cashier?status=unpaid">Belum Dibayar</a><a class="tab ${route.query.status === "paid" ? "active" : ""}" href="#/cashier?status=paid">Lunas</a><a class="tab ${route.query.status === "" ? "active" : ""}" href="#/cashier?status=">Semua</a></div>
			<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Invoice</th><th>Service Order</th><th>Pelanggan</th><th>Kendaraan</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${items.map((item) => `<tr><td><a class="cell-main" href="#/cashier/${encodeURIComponent(item.id)}">${escapeHtml(item.invoice_no)}</a><span class="cell-sub">${dateTime(item.created_at)}</span></td><td>${escapeHtml(item.order_no)}</td><td>${escapeHtml(item.customer_name)}</td><td>${escapeHtml(`${item.brand} ${item.model}`)}<span class="cell-sub">${escapeHtml(item.license_plate)}</span></td><td class="cell-main money">${money(item.total)}</td><td>${status(item.status)}</td><td><a class="btn btn-sm ${item.status === "paid" ? "btn-secondary" : ""}" href="#/cashier/${encodeURIComponent(item.id)}">${item.status === "paid" ? "Lihat" : "Proses"}</a></td></tr>`).join("")}</tbody></table></div><div class="mobile-records">${items.map((item) => `<a class="record-card" style="display:block" href="#/cashier/${encodeURIComponent(item.id)}"><div class="record-top"><strong>${escapeHtml(item.invoice_no)}</strong>${status(item.status)}</div><span class="cell-sub">${escapeHtml(`${item.customer_name} · ${item.license_plate}`)}</span><div class="kpi-value" style="font-size:20px;margin-top:12px">${money(item.total)}</div></a>`).join("")}</div>` : emptyState("Antrean pembayaran kosong", "Invoice yang siap dibayar akan muncul di sini.")}</section>`;
	},
};

export const invoiceDetailPage = {
	active: "cashier",
	async load(route) {
		const [invoice, providers] = await Promise.all([api.get(`/invoices/${encodeURIComponent(route.params.id)}`), api.get("/providers")]);
		return { invoice: invoice.invoice, providers: providers.providers };
	},
	render({ invoice, providers }) {
		const paid = invoice.status === "paid";
		return `${pageHeader(invoice.invoice_no, `${invoice.order_no} · ${invoice.customer_name}`, '<a class="btn btn-secondary" href="#/cashier">← Antrean</a>')}
			<div class="detail-grid"><section class="card"><div class="card-header"><h2>Ringkasan Invoice</h2>${status(invoice.status)}</div><div class="card-body"><div class="grid grid-2"><div><small>Kendaraan</small><h3>${escapeHtml(`${invoice.brand} ${invoice.model}`)}</h3><p class="cell-sub">${escapeHtml(invoice.license_plate)}</p></div><div><small>Pelanggan</small><h3>${escapeHtml(invoice.customer_name)}</h3><p class="cell-sub">${escapeHtml(invoice.customer_phone)}</p></div></div><div style="margin-top:24px;border-top:1px solid var(--color-border);padding-top:18px"><div style="display:flex;justify-content:space-between"><span>Subtotal</span><strong>${money(invoice.subtotal)}</strong></div><div style="display:flex;justify-content:space-between;margin-top:8px"><span>Diskon</span><strong>− ${money(invoice.discount)}</strong></div><div style="display:flex;justify-content:space-between;margin-top:8px"><span>Pajak</span><strong>${money(invoice.tax)}</strong></div></div></div></section><aside class="grid sticky-panel"><div class="invoice-total"><small>Total Pembayaran</small><strong>${money(invoice.total)}</strong><span>${status(invoice.status)}</span></div>${!paid ? `<section class="card"><div class="card-header"><h2>Pilih Metode</h2></div><div class="card-body grid"><button class="btn" id="cash-method">Tunai</button><a class="btn btn-secondary" href="#/cashier/qris/${encodeURIComponent(invoice.id)}">QRIS ${providers.qris?.configured ? "" : "(belum aktif)"}</a></div></section>` : `<section class="card"><div class="card-body"><div class="alert"><div><strong>Invoice sudah lunas</strong><p>Pembayaran ganda diblokir oleh backend.</p></div></div></div></section>`}</aside></div>
			<dialog class="modal" id="cash-dialog"><form id="cash-form"><div class="modal-header"><h2>Pembayaran Tunai</h2><button class="icon-btn" type="button" data-close>×</button></div><div class="modal-body"><div class="invoice-total"><small>Total</small><strong>${money(invoice.total)}</strong></div><div class="field" style="margin-top:18px"><label>Uang Diterima *</label><input class="input" name="cash_received" type="number" min="${Number(invoice.total)}" step="1000" required></div><div id="change-preview" class="alert" style="margin-top:14px"><div><strong>Kembalian</strong><p>${money(0)}</p></div></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Konfirmasi Pembayaran</button></div></form></dialog>`;
	},
	mount({ invoice }) {
		const dialog = document.querySelector("#cash-dialog"); document.querySelector("#cash-method")?.addEventListener("click", () => dialog.showModal()); dialog?.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
		const input = dialog?.querySelector("[name=cash_received]"); input?.addEventListener("input", () => { dialog.querySelector("#change-preview p").textContent = money(Math.max(0, Number(input.value || 0) - Number(invoice.total))); });
		document.querySelector("#cash-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const button = event.target.querySelector("button[type=submit]"); button.disabled = true; try { const result = await api.post(`/invoices/${encodeURIComponent(invoice.id)}/payments`, { method: "cash", cash_received: Number(formDataObject(event.target).cash_received) }, { idempotent: true }); toast(`Pembayaran berhasil. Kembalian ${money(result.payment.change_amount)}`, "success", 7000); dialog.close(); navigate("/transactions"); } catch (error) { toast(error.message, "error"); button.disabled = false; } });
	},
};

export const qrisPage = {
	active: "cashier",
	async load(route) { const [invoice, providers] = await Promise.all([api.get(`/invoices/${encodeURIComponent(route.params.id)}`), api.get("/providers")]); return { invoice: invoice.invoice, providers: providers.providers }; },
	render({ invoice, providers }) {
		const configured = providers.qris?.configured;
		return `${pageHeader("Pembayaran QRIS", invoice.invoice_no, `<a class="btn btn-secondary" href="#/cashier/${encodeURIComponent(invoice.id)}">← Kembali</a>`)}
			<div class="detail-grid"><section class="card"><div class="card-header"><h2>Scan QRIS</h2></div><div class="card-body">${configured ? `<div class="empty-state"><div class="state-icon" style="width:180px;height:180px;border-radius:18px">QR</div><h3>Payload QR menunggu provider</h3><p>Provider dinyatakan aktif, tetapi endpoint pembuatan QR belum memberi payload.</p></div>` : `<div class="error-state"><div class="state-icon">!</div><h3>Layanan QRIS belum dikonfigurasi</h3><p>Gunakan pembayaran tunai. Data invoice tetap aman dan belum ditandai lunas.</p><a class="btn" href="#/cashier/${encodeURIComponent(invoice.id)}">Pilih Tunai</a></div>`}</div></section><aside class="invoice-total sticky-panel"><small>Total Pembayaran</small><strong>${money(invoice.total)}</strong><span>${status(invoice.status)}</span></aside></div>`;
	},
};

export const transactionsPage = {
	active: "transactions",
	async load() { return api.get("/transactions?limit=100"); },
	render(data) {
		const items = data.items || [];
		return `${pageHeader("Transaksi", "Riwayat pembayaran yang diproses kasir")}
			<section class="card">${items.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Pembayaran</th><th>Invoice</th><th>Pelanggan</th><th>Metode</th><th>Jumlah</th><th>Status</th><th>Waktu</th></tr></thead><tbody>${items.map((item) => `<tr><td class="cell-main">${escapeHtml(item.payment_no)}</td><td>${escapeHtml(item.invoice_no)}<span class="cell-sub">${escapeHtml(item.order_no)}</span></td><td>${escapeHtml(item.customer_name)}</td><td>${escapeHtml(item.method.toUpperCase())}</td><td class="cell-main money">${money(item.amount)}</td><td>${status(item.status)}</td><td>${dateTime(item.created_at)}</td></tr>`).join("")}</tbody></table></div>` : emptyState("Belum ada transaksi")}</section>`;
	},
};
