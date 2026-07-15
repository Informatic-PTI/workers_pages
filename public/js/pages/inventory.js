import { api } from "../api/client.js";
import { currentRoles } from "../state/session.js";
import { dateTime, emptyState, escapeHtml, formDataObject, money, pageHeader, status, toast } from "../components/ui.js";
import { navigate } from "../router.js";

const canManageInventory = () => currentRoles().some((role) => ["admin", "hyperuser"].includes(role));

function wireClose(dialog) {
	dialog?.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
	dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}

function compatibilityRow(item = {}, index = 0) {
	return `<div class="compatibility-row subform-row" data-index="${index}">
		<div class="field"><label>Merek *</label><input class="input" name="brand" value="${escapeHtml(item.brand || "")}" placeholder="Honda" required maxlength="80"></div>
		<div class="field"><label>Model *</label><input class="input" name="model" value="${escapeHtml(item.model || "")}" placeholder="Vario 160" required maxlength="120"></div>
		<div class="field"><label>Tahun Awal</label><input class="input" name="year_start" value="${escapeHtml(item.year_start || "")}" type="number" min="1900" max="2100"></div>
		<div class="field"><label>Tahun Akhir</label><input class="input" name="year_end" value="${escapeHtml(item.year_end || "")}" type="number" min="1900" max="2100"></div>
		<button class="btn btn-ghost btn-sm" type="button" data-remove-compat>Hapus</button>
	</div>`;
}

function partDialog(part = null) {
	const editing = Boolean(part);
	const compatibility = part?.compatibility || [];
	return `<dialog class="modal modal-wide" id="part-dialog"><form id="part-form" data-id="${escapeHtml(part?.id || "")}">
		<div class="modal-header"><div><h2>${editing ? "Edit Sparepart" : "Tambah Sparepart"}</h2><span class="cell-sub">Lengkapi identitas, harga, stok, dan kompatibilitas kendaraan.</span></div><button class="icon-btn" type="button" data-close aria-label="Tutup">&times;</button></div>
		<div class="modal-body">
			<div class="form-grid">
				<div class="field"><label>SKU / Kode Barang *</label><input class="input" name="sku" value="${escapeHtml(part?.sku || "")}" required maxlength="80" placeholder="OLI-AHM-MPX2-10W30"></div>
				<div class="field"><label>Nama Sparepart *</label><input class="input" name="name" value="${escapeHtml(part?.name || "")}" required maxlength="180" placeholder="AHM Oil MPX 2 10W-30 0.8 L"></div>
				<div class="field"><label>Kategori *</label><input class="input" name="category" value="${escapeHtml(part?.category || "")}" list="part-categories" required maxlength="100"><datalist id="part-categories"><option>Oli Mesin</option><option>CVT</option><option>Sistem Rem</option><option>Filter Udara</option><option>Busi</option><option>Aki</option><option>Ban</option><option>Coolant</option><option>Kelistrikan</option></datalist></div>
				<div class="field"><label>Lokasi Rak</label><input class="input" name="location" value="${escapeHtml(part?.location || "")}" maxlength="100" placeholder="Rak A-01"></div>
				<div class="field"><label>Harga Beli *</label><input class="input" name="purchase_price" value="${Number(part?.purchase_price || 0)}" type="number" min="0" required></div>
				<div class="field"><label>Harga Jual *</label><input class="input" name="selling_price" value="${Number(part?.selling_price || 0)}" type="number" min="0" required></div>
				${editing ? "" : '<div class="field"><label>Stok Awal *</label><input class="input" name="stock" value="0" type="number" min="0" required><small>Penambahan berikutnya dicatat melalui penerimaan stok.</small></div>'}
				<div class="field"><label>Stok Minimum *</label><input class="input" name="minimum_stock" value="${Number(part?.minimum_stock || 0)}" type="number" min="0" required></div>
				<div class="field"><label>Stok Kritis *</label><input class="input" name="critical_stock" value="${Number(part?.critical_stock || 0)}" type="number" min="0" required><small>Tidak boleh melebihi stok minimum.</small></div>
				${editing ? `<div class="field"><label>Status</label><select class="select" name="status"><option value="active" ${part.status !== "inactive" ? "selected" : ""}>Aktif</option><option value="inactive" ${part.status === "inactive" ? "selected" : ""}>Nonaktif</option></select></div>` : ""}
			</div>
			<section class="subform-section">
				<div class="subform-header"><div><h3>Kompatibilitas Kendaraan</h3><p class="cell-sub">Opsional, dapat diisi lebih dari satu model.</p></div><button class="btn btn-secondary btn-sm" id="add-compatibility" type="button">+ Tambah Model</button></div>
				<div id="compatibility-items">${compatibility.map((item, index) => compatibilityRow(item, index)).join("")}</div>
			</section>
		</div>
		<div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">${editing ? "Simpan Perubahan" : "Simpan Sparepart"}</button></div>
	</form></dialog>`;
}

function wirePartDialog(part = null) {
	const dialog = document.querySelector("#part-dialog");
	const form = document.querySelector("#part-form");
	const list = document.querySelector("#compatibility-items");
	let nextIndex = list?.children.length || 0;
	wireClose(dialog);
	const wireRow = (row) => row.querySelector("[data-remove-compat]")?.addEventListener("click", () => row.remove());
	list?.querySelectorAll(".compatibility-row").forEach(wireRow);
	document.querySelector("#add-compatibility")?.addEventListener("click", () => {
		const wrapper = document.createElement("div"); wrapper.innerHTML = compatibilityRow({}, nextIndex++);
		const row = wrapper.firstElementChild; list.append(row); wireRow(row); row.querySelector("input")?.focus();
	});
	form?.addEventListener("submit", async (event) => {
		event.preventDefault();
		const data = formDataObject(form);
		const compatibility = [...form.querySelectorAll(".compatibility-row")].map((row) => ({
			brand: row.querySelector("[name=brand]").value,
			model: row.querySelector("[name=model]").value,
			year_start: row.querySelector("[name=year_start]").value || null,
			year_end: row.querySelector("[name=year_end]").value || null,
		}));
		const payload = {
			sku: data.sku, name: data.name, category: data.category, location: data.location,
			purchase_price: Number(data.purchase_price), selling_price: Number(data.selling_price),
			minimum_stock: Number(data.minimum_stock), critical_stock: Number(data.critical_stock), compatibility,
			...(data.stock !== undefined ? { stock: Number(data.stock) } : {}), ...(data.status ? { status: data.status } : {}),
		};
		const button = form.querySelector("button[type=submit]"); button.disabled = true;
		try {
			const result = part ? await api.patch(`/spare-parts/${encodeURIComponent(part.id)}`, payload) : await api.post("/spare-parts", payload);
			toast(part ? "Sparepart berhasil diperbarui" : "Sparepart berhasil ditambahkan", "success"); dialog.close();
			if (part) location.reload(); else navigate(`/spare-parts/${result.spare_part.id}`);
		} catch (error) { toast(error.message, "error"); button.disabled = false; }
	});
	return dialog;
}

function compatibilityCard(items = []) {
	return `<section class="card"><div class="card-header"><h2>Kompatibilitas Kendaraan</h2><span class="cell-sub">${items.length} model</span></div><div class="card-body">${items.length ? `<div class="chip-list">${items.map((item) => `<span class="chip">${escapeHtml(`${item.brand} ${item.model}`)} - ${escapeHtml(item.year_start || "Semua tahun")}${item.year_end ? ` s.d. ${escapeHtml(item.year_end)}` : item.year_start ? "+" : ""}</span>`).join("")}</div>` : '<p class="cell-sub">Kompatibilitas spesifik belum dicatat.</p>'}</div></section>`;
}

function stockTrendCard(items = [], currentStock = 0) {
	const points = [...items].reverse();
	const max = Math.max(Number(currentStock), ...points.map((item) => Number(item.stock || 0)), 1);
	return `<section class="card"><div class="card-header"><h2>Tren Stok</h2><span class="cell-sub">30 pergerakan terakhir</span></div><div class="card-body">${points.length ? `<div class="stock-trend" role="img" aria-label="Tren stok sparepart">${points.map((item) => `<div class="stock-bar" style="height:${Math.max(8, Math.round(Number(item.stock || 0) / max * 100))}%" title="${escapeHtml(`${dateTime(item.created_at)} - ${item.stock} unit`)}"></div>`).join("")}</div>` : '<p class="cell-sub">Tren muncul setelah terjadi pergerakan stok.</p>'}</div></section>`;
}

export const sparePartsPage = {
	active: "spare-parts",
	async load(route) {
		const params = new URLSearchParams({ limit: "100" }); if (route.query.q) params.set("q", route.query.q); if (route.query.stock) params.set("stock", route.query.stock);
		return api.get(`/spare-parts?${params}`);
	},
	render(data, route) {
		const items = data.items || [];
		const totalValue = items.reduce((sum, item) => sum + Number(item.stock) * Number(item.purchase_price), 0);
		const low = items.filter((item) => item.stock_state !== "safe").length;
		const critical = items.filter((item) => item.stock_state === "critical").length;
		const actions = canManageInventory() ? '<a class="btn btn-secondary" href="#/inventory/receipts">Penerimaan</a><a class="btn btn-secondary" href="#/suppliers">Supplier</a><button class="btn" id="add-part">+ Sparepart</button>' : "";
		return `${pageHeader("Manajemen Sparepart", "Stok, harga, lokasi, dan pergerakan inventori", actions)}
			<section class="grid grid-3 kpi-grid" style="margin-bottom:20px"><article class="card kpi-card"><div class="kpi-label">Total Sparepart</div><div class="kpi-value">${data.total ?? items.length}</div></article><article class="card kpi-card"><div class="kpi-label">Nilai Inventori</div><div class="kpi-value">${money(totalValue)}</div></article><article class="card kpi-card"><div class="kpi-label">Stok Rendah</div><div class="kpi-value">${low}</div><small>${critical} kritis / habis</small></article></section>
			<div class="toolbar"><div class="input-icon"><span aria-hidden="true">Q</span><input class="input" id="part-search" value="${escapeHtml(route.query.q || "")}" placeholder="Cari sparepart, SKU, atau kategori..."></div><select class="select toolbar-select" id="stock-filter"><option value="">Semua stok</option><option value="low" ${route.query.stock === "low" ? "selected" : ""}>Stok rendah</option><option value="critical" ${route.query.stock === "critical" ? "selected" : ""}>Kritis</option></select></div>
			<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Sparepart</th><th>SKU</th><th>Kategori</th><th>Harga Jual</th><th>Stok</th><th>Minimum</th><th>Lokasi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${items.map((item) => `<tr><td><a class="cell-main" href="#/spare-parts/${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a></td><td>${escapeHtml(item.sku)}</td><td>${escapeHtml(item.category)}</td><td>${money(item.selling_price)}</td><td><strong>${Number(item.stock)}</strong></td><td>${Number(item.minimum_stock)}</td><td>${escapeHtml(item.location || "-")}</td><td>${status(item.stock_state)}</td><td><a class="btn btn-secondary btn-sm" href="#/spare-parts/${encodeURIComponent(item.id)}">Kelola</a></td></tr>`).join("")}</tbody></table></div>
			<div class="mobile-records">${items.map((item) => `<a class="record-card" href="#/spare-parts/${encodeURIComponent(item.id)}"><div class="record-top"><strong>${escapeHtml(item.name)}</strong>${status(item.stock_state)}</div><span class="cell-sub">${escapeHtml(item.sku)} - ${escapeHtml(item.location || "Tanpa lokasi")}</span><div class="record-meta"><span>Stok <b>${Number(item.stock)}</b></span><span>${money(item.selling_price)}</span></div></a>`).join("")}</div>` : emptyState("Belum ada sparepart", "Tambahkan sparepart pertama untuk memulai inventori.")}</section>${canManageInventory() ? partDialog() : ""}`;
	},
	mount() {
		const apply = () => { const q = document.querySelector("#part-search")?.value.trim(); const stock = document.querySelector("#stock-filter")?.value; const params = new URLSearchParams(); if (q) params.set("q", q); if (stock) params.set("stock", stock); navigate(`/spare-parts${params.size ? `?${params}` : ""}`); };
		document.querySelector("#part-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") apply(); });
		document.querySelector("#stock-filter")?.addEventListener("change", apply);
		if (canManageInventory()) { const dialog = wirePartDialog(); document.querySelector("#add-part")?.addEventListener("click", () => dialog.showModal()); }
	},
};

export const sparePartDetailPage = {
	active: "spare-parts",
	async load(route) { return (await api.get(`/spare-parts/${encodeURIComponent(route.params.id)}`)).spare_part; },
	render(part) {
		const margin = Number(part.selling_price) - Number(part.purchase_price);
		const manage = canManageInventory();
		return `${pageHeader(part.name, `${part.sku} - ${part.category}`, `<a class="btn btn-secondary" href="#/spare-parts">&larr; Kembali</a>${manage ? '<button class="btn btn-secondary" id="edit-part">Edit</button><button class="btn" id="quick-stock">+ Mutasi Stok</button>' : ""}`)}
			<div class="detail-grid"><div class="grid"><section class="card"><div class="card-header"><h2>Informasi Sparepart</h2>${status(part.stock_state)}</div><div class="card-body grid grid-3"><div><small>Harga Beli</small><h2>${money(part.purchase_price)}</h2></div><div><small>Harga Jual</small><h2>${money(part.selling_price)}</h2></div><div><small>Margin</small><h2>${money(margin)}</h2></div><div><small>Lokasi</small><h3>${escapeHtml(part.location || "-")}</h3></div><div><small>Minimum</small><h3>${Number(part.minimum_stock)} unit</h3></div><div><small>Kritis</small><h3>${Number(part.critical_stock)} unit</h3></div></div></section>
			${compatibilityCard(part.compatibility)}${stockTrendCard(part.stock_trend, part.stock)}
			<section class="card"><div class="card-header"><h2>Riwayat Pergerakan Stok</h2></div>${part.movements?.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Waktu</th><th>Jenis</th><th>Referensi</th><th>Perubahan</th><th>Sebelum</th><th>Akhir</th><th>Pengguna</th></tr></thead><tbody>${part.movements.map((item) => `<tr><td>${dateTime(item.created_at)}</td><td>${escapeHtml(item.type.replaceAll("_", " "))}</td><td>${escapeHtml(item.reference_id || "-")}</td><td class="stock-delta ${item.delta > 0 ? "positive" : "negative"}">${item.delta > 0 ? "+" : ""}${Number(item.delta)}</td><td>${Number(item.quantity_before)}</td><td>${Number(item.quantity_after)}</td><td>${escapeHtml(item.user_name || "Sistem")}</td></tr>`).join("")}</tbody></table></div><div class="mobile-records">${part.movements.map((item) => `<article class="record-card"><div class="record-top"><strong>${escapeHtml(item.type.replaceAll("_", " "))}</strong><span class="stock-delta ${item.delta > 0 ? "positive" : "negative"}">${item.delta > 0 ? "+" : ""}${Number(item.delta)}</span></div><span class="cell-sub">${dateTime(item.created_at)} - stok akhir ${Number(item.quantity_after)}</span></article>`).join("")}</div>` : emptyState("Belum ada pergerakan")}</section></div>
			<aside class="card sticky-panel"><div class="card-header"><h2>Status Stok</h2>${status(part.status)}</div><div class="card-body"><div class="kpi-value">${Number(part.stock)} <small>unit</small></div><div style="margin-top:10px">${status(part.stock_state)}</div><div class="alert ${part.stock_state === "critical" ? "alert-danger" : ""}" style="margin-top:18px"><div><strong>Ambang Persediaan</strong><p>Minimum ${Number(part.minimum_stock)}, kritis ${Number(part.critical_stock)} unit.</p></div></div><a class="btn btn-secondary" style="width:100%;margin-top:14px" href="#/inventory/stock-in?part=${encodeURIComponent(part.id)}">Penerimaan Supplier</a></div></aside></div>
			${manage ? `${partDialog(part)}<dialog class="modal" id="stock-dialog"><form id="stock-movement-form"><div class="modal-header"><h2>Mutasi Stok Manual</h2><button class="icon-btn" type="button" data-close aria-label="Tutup">&times;</button></div><div class="modal-body form-grid"><div class="field"><label>Jenis *</label><select class="select" name="type"><option value="adjustment_in">Penyesuaian Masuk</option><option value="adjustment_out">Penyesuaian Keluar</option><option value="return">Retur Masuk</option></select></div><div class="field"><label>Jumlah *</label><input class="input" name="quantity" type="number" min="1" required></div><div class="field field-full"><label>Catatan *</label><textarea class="textarea" name="note" required placeholder="Alasan penyesuaian stok"></textarea></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Simpan Mutasi</button></div></form></dialog>` : ""}`;
	},
	mount(part) {
		if (!canManageInventory()) return;
		const partModal = wirePartDialog(part); document.querySelector("#edit-part")?.addEventListener("click", () => partModal.showModal());
		const stockModal = document.querySelector("#stock-dialog"); wireClose(stockModal); document.querySelector("#quick-stock")?.addEventListener("click", () => stockModal.showModal());
		document.querySelector("#stock-movement-form")?.addEventListener("submit", async (event) => {
			event.preventDefault(); const button = event.target.querySelector("button[type=submit]"); button.disabled = true;
			try { await api.post(`/spare-parts/${encodeURIComponent(part.id)}/movements`, formDataObject(event.target), { idempotent: true }); toast("Stok berhasil diperbarui", "success"); stockModal.close(); location.reload(); }
			catch (error) { toast(error.message, "error"); button.disabled = false; }
		});
	},
};

function supplierDialog() {
	return `<dialog class="modal" id="supplier-dialog"><form id="supplier-form"><div class="modal-header"><h2 id="supplier-dialog-title">Tambah Supplier</h2><button class="icon-btn" type="button" data-close aria-label="Tutup">&times;</button></div><div class="modal-body form-grid"><input name="id" type="hidden"><div class="field field-full"><label>Nama Supplier *</label><input class="input" name="name" required maxlength="160"></div><div class="field"><label>Telepon</label><input class="input" name="phone" inputmode="tel" maxlength="40"></div><div class="field"><label>Email</label><input class="input" name="email" type="email" maxlength="160"></div><div class="field field-full"><label>Alamat</label><textarea class="textarea" name="address" maxlength="500"></textarea></div></div><div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Simpan Supplier</button></div></form></dialog>`;
}

export const suppliersPage = {
	active: "suppliers",
	async load() { return api.get("/suppliers"); },
	render(data) {
		const items = data.items || [];
		return `${pageHeader("Supplier", "Kelola pemasok sparepart dan dokumen penerimaan", '<a class="btn btn-secondary" href="#/inventory/receipts">Penerimaan</a><button class="btn" id="add-supplier">+ Tambah Supplier</button>')}
		<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Supplier</th><th>Telepon</th><th>Email</th><th>Alamat</th><th>Aksi</th></tr></thead><tbody>${items.map((item) => `<tr><td class="cell-main">${escapeHtml(item.name)}</td><td>${escapeHtml(item.phone || "-")}</td><td>${escapeHtml(item.email || "-")}</td><td>${escapeHtml(item.address || "-")}</td><td><button class="btn btn-secondary btn-sm" type="button" data-edit-supplier="${escapeHtml(item.id)}">Edit</button></td></tr>`).join("")}</tbody></table></div><div class="mobile-records">${items.map((item) => `<article class="record-card"><div class="record-top"><strong>${escapeHtml(item.name)}</strong><button class="btn btn-secondary btn-sm" type="button" data-edit-supplier="${escapeHtml(item.id)}">Edit</button></div><span class="cell-sub">${escapeHtml(item.phone || "Telepon belum diisi")}</span><span class="cell-sub">${escapeHtml(item.email || item.address || "Kontak belum diisi")}</span></article>`).join("")}</div>` : emptyState("Belum ada supplier", "Tambahkan supplier sebelum membuat dokumen stok masuk.")}</section>${supplierDialog()}`;
	},
	mount(data) {
		const dialog = document.querySelector("#supplier-dialog"); const form = document.querySelector("#supplier-form"); const title = document.querySelector("#supplier-dialog-title"); wireClose(dialog);
		const open = (supplier = null) => { form.reset(); form.elements.id.value = supplier?.id || ""; form.elements.name.value = supplier?.name || ""; form.elements.phone.value = supplier?.phone || ""; form.elements.email.value = supplier?.email || ""; form.elements.address.value = supplier?.address || ""; title.textContent = supplier ? "Edit Supplier" : "Tambah Supplier"; dialog.showModal(); };
		document.querySelector("#add-supplier")?.addEventListener("click", () => open());
		document.querySelectorAll("[data-edit-supplier]").forEach((button) => button.addEventListener("click", () => open((data.items || []).find((item) => item.id === button.dataset.editSupplier))));
		form?.addEventListener("submit", async (event) => { event.preventDefault(); const values = formDataObject(form); const id = values.id; delete values.id; const button = form.querySelector("button[type=submit]"); button.disabled = true; try { if (id) await api.patch(`/suppliers/${encodeURIComponent(id)}`, values); else await api.post("/suppliers", values); toast(id ? "Supplier berhasil diperbarui" : "Supplier berhasil ditambahkan", "success"); dialog.close(); location.reload(); } catch (error) { toast(error.message, "error"); button.disabled = false; } });
	},
};

export const stockReceiptsPage = {
	active: "inventory",
	async load(route) {
		const params = new URLSearchParams({ limit: "100" }); if (route.query.q) params.set("q", route.query.q); if (route.query.supplier) params.set("supplier_id", route.query.supplier);
		const [receipts, suppliers] = await Promise.all([api.get(`/stock-receipts?${params}`), api.get("/suppliers")]);
		return { ...receipts, suppliers: suppliers.items || [] };
	},
	render(data, route) {
		const items = data.items || [];
		return `${pageHeader("Penerimaan Stok", "Riwayat stok masuk dari supplier", '<a class="btn btn-secondary" href="#/suppliers">Kelola Supplier</a><a class="btn" href="#/inventory/stock-in">+ Stok Masuk</a>')}
		<div class="toolbar"><div class="input-icon"><span aria-hidden="true">Q</span><input class="input" id="receipt-search" value="${escapeHtml(route.query.q || "")}" placeholder="Cari nomor penerimaan, dokumen, atau supplier..."></div><select class="select toolbar-select" id="receipt-supplier"><option value="">Semua supplier</option>${data.suppliers.map((item) => `<option value="${escapeHtml(item.id)}" ${route.query.supplier === item.id ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></div>
		<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Penerimaan</th><th>Tanggal</th><th>Supplier</th><th>Dokumen Supplier</th><th>Item</th><th>Total Qty</th><th>Nilai</th><th>Status</th></tr></thead><tbody>${items.map((item) => `<tr><td><a class="cell-main" href="#/inventory/receipts/${encodeURIComponent(item.id)}">${escapeHtml(item.receipt_no)}</a></td><td>${dateTime(item.received_at)}</td><td>${escapeHtml(item.supplier_name)}</td><td>${escapeHtml(item.supplier_document_no || "-")}</td><td>${Number(item.item_count || 0)}</td><td>${Number(item.total_quantity || 0)}</td><td>${money(item.total_amount)}</td><td>${status(item.status)}</td></tr>`).join("")}</tbody></table></div><div class="mobile-records">${items.map((item) => `<a class="record-card" href="#/inventory/receipts/${encodeURIComponent(item.id)}"><div class="record-top"><strong>${escapeHtml(item.receipt_no)}</strong>${status(item.status)}</div><span class="cell-sub">${escapeHtml(item.supplier_name)} - ${dateTime(item.received_at)}</span><div class="record-meta"><span>${Number(item.item_count || 0)} item / ${Number(item.total_quantity || 0)} unit</span><span>${money(item.total_amount)}</span></div></a>`).join("")}</div>` : emptyState("Belum ada penerimaan stok")}</section>`;
	},
	mount() {
		const apply = () => { const q = document.querySelector("#receipt-search")?.value.trim(); const supplier = document.querySelector("#receipt-supplier")?.value; const params = new URLSearchParams(); if (q) params.set("q", q); if (supplier) params.set("supplier", supplier); navigate(`/inventory/receipts${params.size ? `?${params}` : ""}`); };
		document.querySelector("#receipt-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") apply(); }); document.querySelector("#receipt-supplier")?.addEventListener("change", apply);
	},
};

export const stockReceiptDetailPage = {
	active: "inventory",
	async load(route) { return (await api.get(`/stock-receipts/${encodeURIComponent(route.params.id)}`)).receipt; },
	render(receipt) {
		return `${pageHeader(receipt.receipt_no, "Detail dokumen penerimaan stok", '<a class="btn btn-secondary" href="#/inventory/receipts">&larr; Kembali</a><a class="btn" href="#/inventory/stock-in">+ Stok Masuk</a>')}
		<div class="detail-grid"><section class="card"><div class="card-header"><h2>Item Diterima</h2><span class="cell-sub">${receipt.items.length} baris</span></div><div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Sparepart</th><th>SKU</th><th>Qty</th><th>Harga Beli</th><th>Subtotal</th></tr></thead><tbody>${receipt.items.map((item) => `<tr><td><a class="cell-main" href="#/spare-parts/${encodeURIComponent(item.spare_part_id)}">${escapeHtml(item.name)}</a></td><td>${escapeHtml(item.sku)}</td><td>${Number(item.quantity)}</td><td>${money(item.unit_cost)}</td><td>${money(item.subtotal)}</td></tr>`).join("")}</tbody></table></div><div class="mobile-records">${receipt.items.map((item) => `<a class="record-card" href="#/spare-parts/${encodeURIComponent(item.spare_part_id)}"><div class="record-top"><strong>${escapeHtml(item.name)}</strong><span>${Number(item.quantity)} unit</span></div><span class="cell-sub">${escapeHtml(item.sku)} - ${money(item.subtotal)}</span></a>`).join("")}</div></section>
		<aside class="card sticky-panel"><div class="card-header"><h2>Ringkasan</h2>${status(receipt.status)}</div><div class="card-body"><div class="kpi-label">Total Penerimaan</div><div class="kpi-value">${money(receipt.total_amount)}</div><dl class="summary-list"><div><dt>Supplier</dt><dd>${escapeHtml(receipt.supplier_name)}</dd></div><div><dt>Tanggal</dt><dd>${dateTime(receipt.received_at)}</dd></div><div><dt>Dokumen</dt><dd>${escapeHtml(receipt.supplier_document_no || "-")}</dd></div><div><dt>Catatan</dt><dd>${escapeHtml(receipt.note || "-")}</dd></div></dl></div></aside></div>`;
	},
};

function itemRow(parts, index, selectedPartId = "") {
	return `<div class="stock-item subform-row" data-index="${index}"><div class="field"><label>Sparepart & SKU *</label><select class="select" name="spare_part_id" required><option value="">Pilih sparepart</option>${parts.map((part) => `<option value="${escapeHtml(part.id)}" data-cost="${Number(part.purchase_price)}" ${selectedPartId === part.id ? "selected" : ""}>${escapeHtml(part.name)} - ${escapeHtml(part.sku)}</option>`).join("")}</select></div><div class="field"><label>Qty *</label><input class="input" name="quantity" type="number" min="1" value="1" required></div><div class="field"><label>Harga Beli *</label><input class="input" name="unit_cost" type="number" min="0" value="0" required></div><div class="field"><label>Subtotal</label><output class="input output-field" data-subtotal>${money(0)}</output></div><button class="btn btn-ghost btn-sm" type="button" data-remove-item>Hapus</button></div>`;
}

export const stockInPage = {
	active: "inventory",
	async load(route) { const [suppliers, parts] = await Promise.all([api.get("/suppliers"), api.get("/spare-parts?limit=100&status=active")]); return { suppliers: suppliers.items || [], parts: parts.items || [], selectedPartId: route.query.part || "" }; },
	render({ suppliers, parts, selectedPartId }) {
		return `${pageHeader("Tambah Stok Masuk", "Catat penerimaan supplier sebagai dokumen dan pergerakan stok", '<a class="btn btn-secondary" href="#/inventory/receipts">&larr; Riwayat</a><a class="btn btn-secondary" href="#/suppliers">Kelola Supplier</a>')}
			${!suppliers.length ? '<div class="alert alert-danger" style="margin-bottom:16px"><div><strong>Supplier belum tersedia</strong><p>Tambahkan supplier lebih dahulu sebelum menyimpan penerimaan stok.</p></div></div>' : ""}
			<form id="stock-in-form"><div class="detail-grid"><div class="grid"><section class="card"><div class="card-header"><h2>Detail Dokumen</h2></div><div class="card-body form-grid"><div class="field"><label>Tanggal Penerimaan *</label><input class="input" name="received_at" type="datetime-local" required></div><div class="field"><label>Supplier *</label><select class="select" name="supplier_id" required><option value="">Pilih supplier</option>${suppliers.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}</select></div><div class="field"><label>Nomor Dokumen Supplier</label><input class="input" name="supplier_document_no" maxlength="120"></div><div class="field field-full"><label>Catatan</label><textarea class="textarea" name="note" maxlength="500"></textarea></div></div></section>
			<section class="card"><div class="card-header"><h2>Item Masuk</h2><button class="btn btn-secondary btn-sm" id="add-stock-item" type="button">+ Tambah Item</button></div><div class="card-body" id="stock-items">${itemRow(parts, 0, selectedPartId)}</div></section></div>
			<aside class="card sticky-panel"><div class="card-header"><h2>Ringkasan</h2></div><div class="card-body"><div class="kpi-label">Total Penerimaan</div><div class="kpi-value money" id="stock-total">${money(0)}</div><p class="cell-sub" id="stock-count">1 baris item</p><button class="btn" style="width:100%;margin-top:20px" type="submit" ${!suppliers.length || !parts.length ? "disabled" : ""}>Simpan Stok Masuk</button></div></aside></div></form>`;
	},
	mount({ parts, selectedPartId }) {
		const form = document.querySelector("#stock-in-form"); const list = document.querySelector("#stock-items"); let index = 1;
		const recalculate = () => { let total = 0; document.querySelectorAll(".stock-item").forEach((row) => { const quantity = Number(row.querySelector("[name=quantity]").value || 0); const cost = Number(row.querySelector("[name=unit_cost]").value || 0); const subtotal = quantity * cost; total += subtotal; row.querySelector("[data-subtotal]").textContent = money(subtotal); }); document.querySelector("#stock-total").textContent = money(total); document.querySelector("#stock-count").textContent = `${document.querySelectorAll(".stock-item").length} baris item`; };
		const wire = (root) => { const select = root.querySelector("[name=spare_part_id]"); select?.addEventListener("change", (event) => { root.querySelector("[name=unit_cost]").value = event.target.selectedOptions[0]?.dataset.cost || 0; recalculate(); }); root.querySelectorAll("input").forEach((input) => input.addEventListener("input", recalculate)); root.querySelector("[data-remove-item]")?.addEventListener("click", () => { if (document.querySelectorAll(".stock-item").length === 1) return toast("Minimal satu item diperlukan", "error"); root.remove(); recalculate(); }); if (select?.value) { root.querySelector("[name=unit_cost]").value = select.selectedOptions[0]?.dataset.cost || 0; } };
		document.querySelectorAll(".stock-item").forEach(wire); document.querySelector("#add-stock-item")?.addEventListener("click", () => { const wrapper = document.createElement("div"); wrapper.innerHTML = itemRow(parts, index++); const row = wrapper.firstElementChild; list.append(row); wire(row); recalculate(); });
		const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); form.elements.received_at.value = now.toISOString().slice(0, 16); recalculate(); if (selectedPartId) form.querySelector("[name=spare_part_id]")?.dispatchEvent(new Event("change"));
		form.addEventListener("submit", async (event) => { event.preventDefault(); const documentData = formDataObject(form); const items = [...document.querySelectorAll(".stock-item")].map((row) => ({ spare_part_id: row.querySelector("[name=spare_part_id]").value, quantity: Number(row.querySelector("[name=quantity]").value), unit_cost: Number(row.querySelector("[name=unit_cost]").value) })); const payload = { supplier_id: documentData.supplier_id, received_at: new Date(documentData.received_at).toISOString(), supplier_document_no: documentData.supplier_document_no, note: documentData.note, items }; const button = form.querySelector("button[type=submit]"); button.disabled = true; try { const result = await api.post("/stock-receipts", payload, { idempotent: true }); toast("Stok masuk berhasil disimpan", "success"); navigate(`/inventory/receipts/${result.receipt.id}`); } catch (error) { toast(error.message, "error"); button.disabled = false; } });
	},
};
