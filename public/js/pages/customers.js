import { api } from "../api/client.js";
import { dateTime, emptyState, escapeHtml, formDataObject, money, pageHeader, status, toast } from "../components/ui.js";
import { navigate } from "../router.js";

function customerDialog(customer = null) {
	const editing = Boolean(customer);
	return `<dialog class="modal" id="customer-dialog"><form id="customer-form" data-id="${escapeHtml(customer?.id || "")}">
		<div class="modal-header"><h2>${editing ? "Edit Pelanggan" : "Tambah Pelanggan"}</h2><button class="icon-btn" type="button" data-close aria-label="Tutup">&times;</button></div>
		<div class="modal-body form-grid">
			<div class="field field-full"><label>Nama *</label><input class="input" name="name" value="${escapeHtml(customer?.name || "")}" required maxlength="120"></div>
			<div class="field"><label>Nomor Telepon *</label><input class="input" name="phone" value="${escapeHtml(customer?.phone || "")}" inputmode="tel" required></div>
			<div class="field"><label>Email</label><input class="input" name="email" value="${escapeHtml(customer?.email || "")}" type="email"></div>
			<div class="field field-full"><label>Alamat</label><textarea class="textarea" name="address">${escapeHtml(customer?.address || "")}</textarea></div>
			${editing ? `<div class="field"><label>Status</label><select class="select" name="status"><option value="active" ${customer.status !== "inactive" ? "selected" : ""}>Aktif</option><option value="inactive" ${customer.status === "inactive" ? "selected" : ""}>Nonaktif</option></select></div>` : ""}
		</div>
		<div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">${editing ? "Simpan Perubahan" : "Simpan Pelanggan"}</button></div>
	</form></dialog>`;
}

function vehicleDialog(customers, vehicle = null, selectedCustomerId = "") {
	const editing = Boolean(vehicle);
	const customerId = vehicle?.customer_id || selectedCustomerId;
	return `<dialog class="modal" id="vehicle-dialog"><form id="vehicle-form" data-id="${escapeHtml(vehicle?.id || "")}">
		<div class="modal-header"><h2>${editing ? "Edit Kendaraan" : "Tambah Kendaraan"}</h2><button class="icon-btn" type="button" data-close aria-label="Tutup">&times;</button></div>
		<div class="modal-body form-grid">
			<div class="field field-full"><label>Pemilik *</label><select class="select" name="customer_id" required><option value="">Pilih pelanggan</option>${customers.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === customerId ? "selected" : ""}>${escapeHtml(item.name)} - ${escapeHtml(item.phone)}</option>`).join("")}</select></div>
			<div class="field"><label>Merek *</label><input class="input" name="brand" value="${escapeHtml(vehicle?.brand || "")}" placeholder="Honda" required maxlength="80"></div>
			<div class="field"><label>Model *</label><input class="input" name="model" value="${escapeHtml(vehicle?.model || "")}" placeholder="Vario 160" required maxlength="120"></div>
			<div class="field"><label>Nomor Polisi *</label><input class="input" name="license_plate" value="${escapeHtml(vehicle?.license_plate || "")}" placeholder="B 1234 XYZ" required maxlength="16"></div>
			<div class="field"><label>Tahun</label><input class="input" name="year" value="${escapeHtml(vehicle?.year || "")}" type="number" min="1950" max="${new Date().getFullYear() + 1}"></div>
			<div class="field"><label>Warna</label><input class="input" name="color" value="${escapeHtml(vehicle?.color || "")}" maxlength="60"></div>
			<div class="field"><label>Odometer (km)</label><input class="input" name="odometer" value="${Number(vehicle?.odometer || 0)}" type="number" min="0" required></div>
		</div>
		<div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">${editing ? "Simpan Perubahan" : "Simpan Kendaraan"}</button></div>
	</form></dialog>`;
}

function wireDialog(dialog) {
	dialog?.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
	dialog?.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
}

function customerPayload(form) {
	const data = formDataObject(form);
	return { name: data.name, phone: data.phone, email: data.email, address: data.address, ...(data.status ? { status: data.status } : {}) };
}

function vehiclePayload(form) {
	const data = formDataObject(form);
	return { ...data, year: data.year || null, odometer: Number(data.odometer || 0) };
}

async function submitCustomer(form, dialog) {
	const button = form.querySelector("button[type=submit]");
	button.disabled = true;
	try {
		const id = form.dataset.id;
		const result = id ? await api.patch(`/customers/${encodeURIComponent(id)}`, customerPayload(form)) : await api.post("/customers", customerPayload(form));
		toast(id ? "Data pelanggan berhasil diperbarui" : "Pelanggan berhasil ditambahkan", "success");
		dialog.close();
		return result.customer;
	} catch (error) {
		toast(error.message, "error");
		button.disabled = false;
		return null;
	}
}

async function submitVehicle(form, dialog) {
	const button = form.querySelector("button[type=submit]");
	button.disabled = true;
	try {
		const id = form.dataset.id;
		const result = id ? await api.patch(`/vehicles/${encodeURIComponent(id)}`, vehiclePayload(form)) : await api.post("/vehicles", vehiclePayload(form));
		toast(id ? "Data kendaraan berhasil diperbarui" : "Kendaraan berhasil ditambahkan", "success");
		dialog.close();
		return result.vehicle;
	} catch (error) {
		toast(error.message, "error");
		button.disabled = false;
		return null;
	}
}

export const customersPage = {
	active: "customers",
	async load(route) { return api.get(`/customers?limit=100${route.query.q ? `&q=${encodeURIComponent(route.query.q)}` : ""}`); },
	render(data, route) {
		const items = data.items || [];
		return `${pageHeader("Pelanggan", "Data pelanggan, kendaraan, dan riwayat transaksi", '<button class="btn" id="add-customer">+ Tambah Pelanggan</button>')}
			<div class="toolbar"><div class="input-icon"><span aria-hidden="true">Q</span><input class="input" id="customer-search" value="${escapeHtml(route.query.q || "")}" placeholder="Cari nama, telepon, atau email..."></div></div>
			<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Pelanggan</th><th>Telepon</th><th>Kendaraan</th><th>Service Terakhir</th><th>Kunjungan</th><th>Total Transaksi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${items.map((item) => `<tr><td><a class="cell-main" href="#/customers/${encodeURIComponent(item.id)}">${escapeHtml(item.name)}</a><span class="cell-sub">${escapeHtml(item.email || "-")}</span></td><td>${escapeHtml(item.phone)}</td><td>${Number(item.vehicle_count || 0)}</td><td>${dateTime(item.last_service_at)}</td><td>${Number(item.service_count || 0)}</td><td class="money">${money(item.total_spent)}</td><td>${status(item.status)}</td><td><a class="btn btn-secondary btn-sm" href="#/customers/${encodeURIComponent(item.id)}">Kelola</a></td></tr>`).join("")}</tbody></table></div>
			<div class="mobile-records">${items.map((item) => `<a class="record-card" href="#/customers/${encodeURIComponent(item.id)}"><div class="record-top"><strong>${escapeHtml(item.name)}</strong>${status(item.status)}</div><span class="cell-sub">${escapeHtml(item.phone)}${item.email ? ` - ${escapeHtml(item.email)}` : ""}</span><div class="record-meta"><span>${Number(item.vehicle_count || 0)} kendaraan</span><span>${Number(item.service_count || 0)} kunjungan</span><span>${money(item.total_spent)}</span></div></a>`).join("")}</div>` : emptyState("Belum ada pelanggan", "Tambahkan pelanggan untuk memulai booking.")}</section>${customerDialog()}`;
	},
	mount() {
		const dialog = document.querySelector("#customer-dialog");
		wireDialog(dialog);
		document.querySelector("#add-customer")?.addEventListener("click", () => dialog.showModal());
		document.querySelector("#customer-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") navigate(`/customers${event.target.value.trim() ? `?q=${encodeURIComponent(event.target.value.trim())}` : ""}`); });
		document.querySelector("#customer-form")?.addEventListener("submit", async (event) => { event.preventDefault(); if (await submitCustomer(event.target, dialog)) location.reload(); });
	},
};

export const customerDetailPage = {
	active: "customers",
	async load(route) { return (await api.get(`/customers/${encodeURIComponent(route.params.id)}`)).customer; },
	render(customer) {
		return `${pageHeader(customer.name, "Detail pelanggan dan kendaraan terdaftar", `<a class="btn btn-secondary" href="#/customers">&larr; Kembali</a><button class="btn btn-secondary" id="edit-customer">Edit Pelanggan</button><button class="btn" id="add-vehicle">+ Kendaraan</button>`)}
			<div class="detail-grid"><section class="card"><div class="card-header"><h2>Kendaraan</h2><span class="cell-sub">${customer.vehicles?.length || 0} unit</span></div>${customer.vehicles?.length ? `<div class="record-list">${customer.vehicles.map((vehicle) => `<a class="record-card" href="#/vehicles/${encodeURIComponent(vehicle.id)}"><div class="record-top"><strong>${escapeHtml(`${vehicle.brand} ${vehicle.model}`)}</strong><span>${escapeHtml(vehicle.license_plate)}</span></div><span class="cell-sub">${Number(vehicle.odometer || 0).toLocaleString("id-ID")} km - ${Number(vehicle.service_count || 0)} service</span></a>`).join("")}</div>` : emptyState("Belum ada kendaraan")}</section>
			<aside class="card"><div class="card-header"><h2>Kontak</h2>${status(customer.status)}</div><div class="card-body"><p><strong>${escapeHtml(customer.phone)}</strong></p><p class="cell-sub">${escapeHtml(customer.email || "Email belum diisi")}</p><p style="margin-top:14px">${escapeHtml(customer.address || "Alamat belum diisi")}</p></div></aside></div>
			${customerDialog(customer)}${vehicleDialog([customer], null, customer.id)}`;
	},
	mount(customer) {
		const customerModal = document.querySelector("#customer-dialog");
		const vehicleModal = document.querySelector("#vehicle-dialog");
		wireDialog(customerModal); wireDialog(vehicleModal);
		document.querySelector("#edit-customer")?.addEventListener("click", () => customerModal.showModal());
		document.querySelector("#add-vehicle")?.addEventListener("click", () => vehicleModal.showModal());
		document.querySelector("#customer-form")?.addEventListener("submit", async (event) => { event.preventDefault(); if (await submitCustomer(event.target, customerModal)) location.reload(); });
		document.querySelector("#vehicle-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const vehicle = await submitVehicle(event.target, vehicleModal); if (vehicle) navigate(`/vehicles/${vehicle.id}`); });
	},
};

export const vehiclesPage = {
	active: "vehicles",
	async load(route) {
		const [vehicles, customers] = await Promise.all([
			api.get(`/vehicles?limit=100${route.query.q ? `&q=${encodeURIComponent(route.query.q)}` : ""}`),
			api.get("/customers?limit=100&status=active"),
		]);
		return { ...vehicles, customers: customers.items || [] };
	},
	render(data, route) {
		const items = data.items || [];
		return `${pageHeader("Kendaraan", "Kendaraan pelanggan dan riwayat perawatan", '<button class="btn" id="add-vehicle">+ Tambah Kendaraan</button>')}
		<div class="toolbar"><div class="input-icon"><span aria-hidden="true">Q</span><input class="input" id="vehicle-search" value="${escapeHtml(route.query.q || "")}" placeholder="Cari plat, merek, model, atau pelanggan..."></div></div>
		<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Kendaraan</th><th>Nomor Polisi</th><th>Pemilik</th><th>Odometer</th><th>Riwayat</th><th>Aksi</th></tr></thead><tbody>${items.map((item) => `<tr><td><a class="cell-main" href="#/vehicles/${encodeURIComponent(item.id)}">${escapeHtml(`${item.brand} ${item.model}`)}</a><span class="cell-sub">${escapeHtml(item.color || "-")} - ${escapeHtml(item.year || "-")}</span></td><td><strong>${escapeHtml(item.license_plate)}</strong></td><td>${escapeHtml(item.customer_name)}</td><td>${Number(item.odometer || 0).toLocaleString("id-ID")} km</td><td>${Number(item.service_count || 0)} service</td><td><a class="btn btn-secondary btn-sm" href="#/vehicles/${encodeURIComponent(item.id)}">Kelola</a></td></tr>`).join("")}</tbody></table></div>
		<div class="mobile-records">${items.map((item) => `<a class="record-card" href="#/vehicles/${encodeURIComponent(item.id)}"><div class="record-top"><strong>${escapeHtml(`${item.brand} ${item.model}`)}</strong><span>${escapeHtml(item.license_plate)}</span></div><span class="cell-sub">${escapeHtml(item.customer_name)}</span><div class="record-meta"><span>${Number(item.odometer || 0).toLocaleString("id-ID")} km</span><span>${Number(item.service_count || 0)} service</span></div></a>`).join("")}</div>` : emptyState("Belum ada kendaraan")}</section>${vehicleDialog(data.customers || [])}`;
	},
	mount() {
		const dialog = document.querySelector("#vehicle-dialog"); wireDialog(dialog);
		document.querySelector("#add-vehicle")?.addEventListener("click", () => dialog.showModal());
		document.querySelector("#vehicle-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") navigate(`/vehicles${event.target.value.trim() ? `?q=${encodeURIComponent(event.target.value.trim())}` : ""}`); });
		document.querySelector("#vehicle-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const vehicle = await submitVehicle(event.target, dialog); if (vehicle) navigate(`/vehicles/${vehicle.id}`); });
	},
};

export const vehicleDetailPage = {
	active: "vehicles",
	async load(route) {
		const [vehicleResult, customers] = await Promise.all([api.get(`/vehicles/${encodeURIComponent(route.params.id)}`), api.get("/customers?limit=100")]);
		return { vehicle: vehicleResult.vehicle, customers: customers.items || [] };
	},
	render(data) {
		const vehicle = data.vehicle;
		return `${pageHeader(`${vehicle.brand} ${vehicle.model}`, vehicle.license_plate, '<a class="btn btn-secondary" href="#/vehicles">&larr; Kembali</a><button class="btn" id="edit-vehicle">Edit Kendaraan</button>')}
			<div class="detail-grid"><div class="grid"><section class="card"><div class="card-header"><h2>Informasi Kendaraan</h2></div><div class="card-body grid grid-3"><div><small>Tahun</small><h3>${escapeHtml(vehicle.year || "-")}</h3></div><div><small>Warna</small><h3>${escapeHtml(vehicle.color || "-")}</h3></div><div><small>Odometer</small><h3>${Number(vehicle.odometer || 0).toLocaleString("id-ID")} km</h3></div></div></section>
			<section class="card"><div class="card-header"><h2>Riwayat Service</h2></div>${vehicle.service_history?.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Service Order</th><th>Tanggal</th><th>Mekanik</th><th>Status</th><th>Invoice</th></tr></thead><tbody>${vehicle.service_history.map((item) => `<tr><td><a class="cell-main" href="#/service-orders/${encodeURIComponent(item.id)}">${escapeHtml(item.order_no)}</a><span class="cell-sub">${escapeHtml(item.complaint)}</span></td><td>${dateTime(item.created_at)}</td><td>${escapeHtml(item.mechanic_name || "-")}</td><td>${status(item.status)}</td><td>${item.invoice_no ? `${escapeHtml(item.invoice_no)} - ${money(item.total)}` : "-"}</td></tr>`).join("")}</tbody></table></div><div class="mobile-records">${vehicle.service_history.map((item) => `<a class="record-card" href="#/service-orders/${encodeURIComponent(item.id)}"><div class="record-top"><strong>${escapeHtml(item.order_no)}</strong>${status(item.status)}</div><span class="cell-sub">${dateTime(item.created_at)} - ${escapeHtml(item.mechanic_name || "Belum ditugaskan")}</span></a>`).join("")}</div>` : emptyState("Belum ada riwayat service")}</section></div>
			<aside class="card"><div class="card-header"><h2>Owner Info</h2></div><div class="card-body"><h3>${escapeHtml(vehicle.customer_name)}</h3><p class="cell-sub">${escapeHtml(vehicle.customer_phone)}</p><p class="cell-sub">${escapeHtml(vehicle.customer_email || "Email belum tersedia")}</p><a class="btn btn-secondary btn-sm" style="margin-top:16px" href="#/customers/${encodeURIComponent(vehicle.customer_id)}">Lihat Pelanggan</a></div></aside></div>${vehicleDialog(data.customers, vehicle)}`;
	},
	mount(data) {
		const dialog = document.querySelector("#vehicle-dialog"); wireDialog(dialog);
		document.querySelector("#edit-vehicle")?.addEventListener("click", () => dialog.showModal());
		document.querySelector("#vehicle-form")?.addEventListener("submit", async (event) => { event.preventDefault(); if (await submitVehicle(event.target, dialog)) location.reload(); });
	},
};
