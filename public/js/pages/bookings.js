import { api } from "../api/client.js";
import { confirmDialog, dateTime, emptyState, escapeHtml, formDataObject, pageHeader, status, toast } from "../components/ui.js";
import { navigate } from "../router.js";

function bookingRows(items) {
	return items.map((item) => `<tr><td><a class="cell-main" href="#/bookings/${encodeURIComponent(item.id)}">${escapeHtml(item.booking_no)}</a><span class="cell-sub">${dateTime(item.scheduled_at)}</span></td><td><span class="cell-main">${escapeHtml(item.customer_name)}</span><span class="cell-sub">${escapeHtml(item.customer_phone)}</span></td><td><span class="cell-main">${escapeHtml(`${item.brand} ${item.model}`)}</span><span class="cell-sub">${escapeHtml(item.license_plate)}</span></td><td>${status(item.status)}</td><td>${["scheduled", "confirmed"].includes(item.status) ? `<button class="btn btn-sm" data-check-in="${escapeHtml(item.id)}">Check-in</button>` : item.service_order_id ? `<a class="btn btn-secondary btn-sm" href="#/service-orders/${encodeURIComponent(item.service_order_id)}">Buka SO</a>` : "—"}</td></tr>`).join("");
}

function bookingCards(items) {
	return items.map((item) => `<article class="record-card"><div class="record-top"><div><a class="cell-main" href="#/bookings/${encodeURIComponent(item.id)}">${escapeHtml(item.booking_no)}</a><span class="cell-sub">${dateTime(item.scheduled_at)}</span></div>${status(item.status)}</div><div class="record-meta"><span><b>Pelanggan</b><br>${escapeHtml(item.customer_name)}</span><span><b>Kendaraan</b><br>${escapeHtml(item.license_plate)}</span></div>${["scheduled", "confirmed"].includes(item.status) ? `<button class="btn btn-sm" style="width:100%;margin-top:14px" data-check-in="${escapeHtml(item.id)}">Check-in</button>` : ""}</article>`).join("");
}

export const bookingsPage = {
	active: "bookings",
	async load(route) {
		const params = new URLSearchParams({ limit: "50", ...(route.query.q ? { q: route.query.q } : {}), ...(route.query.status ? { status: route.query.status } : {}) });
		return api.get(`/bookings?${params}`);
	},
	render(data, route) {
		const items = data.items || [];
		return `${pageHeader("Booking Service", "Kelola jadwal kedatangan dan proses check-in", '<a class="btn" href="#/bookings/new">＋ Booking Baru</a>')}
			<div class="toolbar"><div class="input-icon"><span>⌕</span><input class="input" id="booking-search" placeholder="Cari nomor booking, pelanggan, atau plat…" value="${escapeHtml(route.query.q || "")}"></div><select class="select" id="booking-status" style="width:auto"><option value="">Semua status</option>${["scheduled", "confirmed", "checked_in", "cancelled", "no_show"].map((value) => `<option value="${value}" ${route.query.status === value ? "selected" : ""}>${value.replaceAll("_", " ")}</option>`).join("")}</select></div>
			<section class="card">${items.length ? `<div class="table-wrap desktop-table"><table class="table"><thead><tr><th>Booking</th><th>Pelanggan</th><th>Kendaraan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${bookingRows(items)}</tbody></table></div><div class="mobile-records">${bookingCards(items)}</div>` : emptyState("Belum ada booking", "Buat booking pertama untuk menjadwalkan pelanggan.")}</section>`;
	},
	mount(_data, route) {
		const apply = () => {
			const q = document.querySelector("#booking-search")?.value.trim();
			const statusValue = document.querySelector("#booking-status")?.value;
			const params = new URLSearchParams(); if (q) params.set("q", q); if (statusValue) params.set("status", statusValue);
			navigate(`/bookings${params.size ? `?${params}` : ""}`);
		};
		document.querySelector("#booking-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") apply(); });
		document.querySelector("#booking-status")?.addEventListener("change", apply);
		document.querySelectorAll("[data-check-in]").forEach((button) => button.addEventListener("click", async () => {
			if (!await confirmDialog({ title: "Check-in booking", message: "Buat Service Order dari booking ini? Tindakan aman jika tombol ditekan ulang.", confirmText: "Check-in" })) return;
			button.disabled = true;
			try { const result = await api.post(`/bookings/${encodeURIComponent(button.dataset.checkIn)}/check-in`, { priority: "normal" }, { idempotent: true }); toast(result.replayed ? "Service Order sudah pernah dibuat" : "Check-in berhasil", "success"); navigate(`/service-orders/${result.service_order.id}`); }
			catch (error) { toast(error.message, "error"); button.disabled = false; }
		}));
	},
};

export const bookingNewPage = {
	active: "bookings",
	async load() {
		const [customers, vehicles] = await Promise.all([api.get("/customers?limit=100"), api.get("/vehicles?limit=100")]);
		return { customers: customers.items || [], vehicles: vehicles.items || [] };
	},
	render({ customers, vehicles }) {
		const minDate = new Date(Date.now() + 3600000); minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset());
		return `${pageHeader("Booking Baru", "Jadwalkan pelanggan dan kendaraan yang sudah terdaftar", '<a class="btn btn-secondary" href="#/bookings">← Kembali</a>')}
			<form id="booking-form" class="detail-grid"><section class="card"><div class="card-header"><h2>Detail Booking</h2></div><div class="card-body form-grid">
				<div class="field"><label for="customer_id">Pelanggan *</label><select class="select" id="customer_id" name="customer_id" required><option value="">Pilih pelanggan</option>${customers.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.phone)}</option>`).join("")}</select></div>
				<div class="field"><label for="vehicle_id">Kendaraan *</label><select class="select" id="vehicle_id" name="vehicle_id" required disabled><option value="">Pilih pelanggan dahulu</option>${vehicles.map((item) => `<option value="${escapeHtml(item.id)}" data-customer="${escapeHtml(item.customer_id)}">${escapeHtml(`${item.brand} ${item.model} · ${item.license_plate}`)}</option>`).join("")}</select></div>
				<div class="field"><label for="scheduled_at">Jadwal *</label><input class="input" id="scheduled_at" name="scheduled_at" type="datetime-local" min="${minDate.toISOString().slice(0, 16)}" required></div>
				<div class="field"><label for="channel">Sumber Booking</label><select class="select" id="channel" name="channel"><option value="counter">Datang / Telepon</option><option value="whatsapp">WhatsApp</option><option value="web">Web</option></select></div>
				<div class="field field-full"><label for="complaint">Keluhan / Kebutuhan Service *</label><textarea class="textarea" id="complaint" name="complaint" maxlength="1000" placeholder="Jelaskan gejala atau pekerjaan yang diminta…" required></textarea></div>
			</div></section><aside class="card sticky-panel"><div class="card-header"><h2>Ringkasan Booking</h2></div><div class="card-body"><p id="booking-summary" class="cell-sub">Lengkapi formulir untuk melihat ringkasan.</p><button class="btn" id="save-booking" style="width:100%;margin-top:20px" type="submit">Simpan Booking</button></div></aside></form>`;
	},
	mount({ customers, vehicles }) {
		const form = document.querySelector("#booking-form");
		const customer = document.querySelector("#customer_id");
		const vehicle = document.querySelector("#vehicle_id");
		const updateVehicles = () => {
			const selected = customer.value; vehicle.disabled = !selected; vehicle.value = "";
			[...vehicle.options].forEach((option, index) => { if (index) option.hidden = option.dataset.customer !== selected; });
			vehicle.options[0].textContent = selected ? "Pilih kendaraan" : "Pilih pelanggan dahulu";
		};
		const summary = () => {
			const data = formDataObject(form); const customerItem = customers.find((item) => item.id === data.customer_id); const vehicleItem = vehicles.find((item) => item.id === data.vehicle_id);
			document.querySelector("#booking-summary").innerHTML = customerItem && vehicleItem ? `<strong>${escapeHtml(customerItem.name)}</strong><br>${escapeHtml(`${vehicleItem.brand} ${vehicleItem.model} · ${vehicleItem.license_plate}`)}<br><br>${data.scheduled_at ? dateTime(new Date(data.scheduled_at).toISOString()) : "Pilih jadwal"}` : "Lengkapi pelanggan dan kendaraan.";
		};
		customer?.addEventListener("change", () => { updateVehicles(); summary(); }); form?.addEventListener("input", summary);
		form?.addEventListener("submit", async (event) => {
			event.preventDefault(); const button = document.querySelector("#save-booking"); button.disabled = true; button.textContent = "Menyimpan…";
			try { const data = formDataObject(form); data.scheduled_at = new Date(data.scheduled_at).toISOString(); const result = await api.post("/bookings", data, { idempotent: true }); toast("Booking berhasil disimpan", "success"); navigate(`/bookings/${result.booking.id}`); }
			catch (error) { toast(error.message, "error"); button.disabled = false; button.textContent = "Simpan Booking"; }
		});
	},
};

export const bookingDetailPage = {
	active: "bookings",
	async load(route) { return (await api.get(`/bookings/${encodeURIComponent(route.params.id)}`)).booking; },
	render(item) {
		return `${pageHeader(item.booking_no, "Detail jadwal booking", '<a class="btn btn-secondary" href="#/bookings">← Kembali</a>')}
			<div class="detail-grid"><section class="card"><div class="card-header"><h2>Informasi Booking</h2>${status(item.status)}</div><div class="card-body grid grid-2"><div><small>Pelanggan</small><h3>${escapeHtml(item.customer_name)}</h3><p class="cell-sub">${escapeHtml(item.customer_phone)}</p></div><div><small>Kendaraan</small><h3>${escapeHtml(`${item.brand} ${item.model}`)}</h3><p class="cell-sub">${escapeHtml(item.license_plate)}</p></div><div><small>Jadwal</small><h3>${dateTime(item.scheduled_at)}</h3></div><div><small>Sumber</small><h3>${escapeHtml(item.channel)}</h3></div></div></section><aside class="card"><div class="card-header"><h2>Keluhan</h2></div><div class="card-body"><p>${escapeHtml(item.complaint)}</p></div></aside></div>`;
	},
	mount(item) {
		const actions = document.querySelector(".page-actions");
		if (!actions) return;
		const addStatusButton = (nextStatus, label, danger = false) => {
			const button = document.createElement("button");
			button.className = `btn ${danger ? "btn-danger" : "btn-secondary"}`; button.type = "button"; button.textContent = label;
			button.addEventListener("click", async () => {
				if (!await confirmDialog({ title: label, message: `Ubah status booking ${item.booking_no} menjadi ${label.toLowerCase()}?`, confirmText: label, danger })) return;
				button.disabled = true;
				try { await api.patch(`/bookings/${encodeURIComponent(item.id)}`, { status: nextStatus }); toast("Status booking berhasil diperbarui", "success"); location.reload(); }
				catch (error) { toast(error.message, "error"); button.disabled = false; }
			});
			actions.prepend(button);
		};
		if (item.status === "scheduled") addStatusButton("confirmed", "Konfirmasi");
		if (["scheduled", "confirmed"].includes(item.status)) {
			addStatusButton("no_show", "Tidak Hadir", true);
			addStatusButton("cancelled", "Batalkan", true);
			const checkIn = document.createElement("button"); checkIn.className = "btn"; checkIn.type = "button"; checkIn.textContent = "Check-in";
			checkIn.addEventListener("click", async () => { if (!await confirmDialog({ title: "Check-in booking", message: "Buat Service Order dari booking ini?", confirmText: "Check-in" })) return; checkIn.disabled = true; try { const result = await api.post(`/bookings/${encodeURIComponent(item.id)}/check-in`, { priority: "normal" }, { idempotent: true }); toast("Check-in berhasil", "success"); navigate(`/service-orders/${result.service_order.id}`); } catch (error) { toast(error.message, "error"); checkIn.disabled = false; } });
			actions.prepend(checkIn);
		}
		if (item.service_order_id) {
			const serviceOrder = document.createElement("a"); serviceOrder.className = "btn"; serviceOrder.href = `#/service-orders/${encodeURIComponent(item.service_order_id)}`; serviceOrder.textContent = "Buka Service Order"; actions.prepend(serviceOrder);
		}
		if (!item.customer_phone) return;
		const whatsapp = document.createElement("button");
		whatsapp.className = "btn btn-secondary"; whatsapp.type = "button"; whatsapp.textContent = "Kirim WhatsApp"; actions.prepend(whatsapp);
		whatsapp.addEventListener("click", async () => {
			whatsapp.disabled = true;
			try { await api.post("/providers/communications/whatsapp", { to: item.customer_phone, message: `Halo ${item.customer_name}, booking ${item.booking_no} untuk ${item.license_plate} dijadwalkan pada ${dateTime(item.scheduled_at)}. - Irwan Motor` }); toast("Konfirmasi WhatsApp diterima provider", "success"); }
			catch (error) { toast(error.message, "error"); }
			finally { whatsapp.disabled = false; }
		});
	},
};
