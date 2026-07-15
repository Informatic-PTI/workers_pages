import { api } from "../api/client.js";
import { currentRoles, currentUser } from "../state/session.js";
import { dateTime, emptyState, escapeHtml, formDataObject, pageHeader, status, toast } from "../components/ui.js";

function mechanicDialog() {
	return `<dialog class="modal" id="mechanic-dialog"><form id="mechanic-form">
		<div class="modal-header"><h2 id="mechanic-dialog-title">Tambah Mekanik</h2><button class="icon-btn" type="button" data-close aria-label="Tutup">&times;</button></div>
		<div class="modal-body form-grid">
			<input name="id" type="hidden">
			<div class="field"><label>Nama *</label><input class="input" name="name" required maxlength="160"></div>
			<div class="field"><label>Nomor Telepon</label><input class="input" name="phone" inputmode="tel" maxlength="40"></div>
			<div class="field field-full"><label>Spesialisasi</label><textarea class="textarea" name="specialty" maxlength="300" placeholder="Contoh: CVT, injeksi, kelistrikan, dan diagnostic"></textarea></div>
			<div class="field"><label>Status</label><select class="select" name="status"><option value="available">Available</option><option value="busy">Busy</option><option value="off_duty">Off Duty</option></select></div>
		</div>
		<div class="modal-footer"><button class="btn btn-secondary" type="button" data-close>Batal</button><button class="btn" type="submit">Simpan Mekanik</button></div>
	</form></dialog>`;
}

export const mechanicsPage = {
	active: "mechanics",
	async load() { return api.get("/mechanics"); },
	render(data) {
		const items = data.items || [];
		return `${pageHeader("Mekanik", "Ketersediaan dan beban kerja tim mekanik", '<button class="btn" id="add-mechanic">+ Tambah Mekanik</button>')}
			<section class="grid grid-3 mechanic-grid">${items.length ? items.map((item) => `<article class="card"><div class="card-body"><div class="record-top"><div style="display:flex;align-items:center;gap:12px;min-width:0"><div class="avatar">${escapeHtml(item.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join(""))}</div><div style="min-width:0"><h2>${escapeHtml(item.name)}</h2><span class="cell-sub truncate">${escapeHtml(item.specialty || "Mekanik umum")}</span></div></div><button class="btn btn-secondary btn-sm" type="button" data-edit-mechanic="${escapeHtml(item.id)}">Edit</button></div><div class="record-meta"><span>${escapeHtml(item.phone || "Telepon belum diisi")}</span><strong>${Number(item.active_orders || 0)} pekerjaan aktif</strong></div><div style="margin-top:14px">${status(item.status)}</div></div></article>`).join("") : emptyState("Belum ada mekanik", "Tambahkan mekanik agar Service Order dapat ditugaskan.")}</section>${mechanicDialog()}`;
	},
	mount(data) {
		const dialog = document.querySelector("#mechanic-dialog");
		const form = document.querySelector("#mechanic-form");
		const title = document.querySelector("#mechanic-dialog-title");
		const open = (mechanic = null) => {
			form.reset();
			form.elements.id.value = mechanic?.id || "";
			form.elements.name.value = mechanic?.name || "";
			form.elements.phone.value = mechanic?.phone || "";
			form.elements.specialty.value = mechanic?.specialty || "";
			form.elements.status.value = mechanic?.status || "available";
			title.textContent = mechanic ? "Edit Mekanik" : "Tambah Mekanik";
			dialog.showModal();
		};
		dialog?.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => dialog.close()));
		document.querySelector("#add-mechanic")?.addEventListener("click", () => open());
		document.querySelectorAll("[data-edit-mechanic]").forEach((button) => button.addEventListener("click", () => open((data.items || []).find((item) => item.id === button.dataset.editMechanic))));
		form?.addEventListener("submit", async (event) => {
			event.preventDefault();
			const values = formDataObject(form); const id = values.id; delete values.id;
			const submit = form.querySelector("button[type=submit]"); submit.disabled = true;
			try {
				if (id) await api.patch(`/mechanics/${encodeURIComponent(id)}`, values); else await api.post("/mechanics", values);
				toast(id ? "Data mekanik berhasil diperbarui" : "Mekanik berhasil ditambahkan", "success");
				dialog.close(); location.reload();
			} catch (error) { toast(error.message, "error"); submit.disabled = false; }
		});
	},
};

export const activityPage = {
	active: "activity",
	async load() { return api.get("/activity?limit=100"); },
	render(data) {
		const items = data.items || [];
		return `${pageHeader("Log Aktivitas", "Audit operasional dan keamanan aplikasi")}
			<section class="card">${items.length ? `<div class="table-wrap"><table class="table"><thead><tr><th>Waktu</th><th>Event</th><th>User</th><th>Target</th><th>Outcome</th><th>Severity</th></tr></thead><tbody>${items.map((item) => `<tr><td>${dateTime(item.created_at)}</td><td class="cell-main">${escapeHtml(item.event_type)}</td><td>${escapeHtml(item.user_id || "Sistem")}</td><td>${escapeHtml([item.target_type, item.target_id].filter(Boolean).join(" · ") || "—")}</td><td>${status(item.outcome)}</td><td>${escapeHtml(item.severity)}</td></tr>`).join("")}</tbody></table></div>` : emptyState("Log belum tersedia")}</section>`;
	},
};

export const profilePage = {
	active: "profile",
	render() {
		const user = currentUser() || {}; const roles = currentRoles();
		return `${pageHeader("Profil", "Informasi akun dari sistem autentikasi yang ada")}
			<div class="detail-grid"><section class="card"><div class="card-body"><div style="display:flex;align-items:center;gap:16px"><div class="avatar" style="width:64px;height:64px;font-size:20px">${escapeHtml((user.display_name || user.username || "U").slice(0, 2).toUpperCase())}</div><div><h1>${escapeHtml(user.display_name || user.username || user.id)}</h1><p class="cell-sub">${escapeHtml(user.id || "")}</p></div></div><div class="grid grid-2" style="margin-top:28px"><div><small>Username</small><h3>${escapeHtml(user.username || "—")}</h3></div><div><small>Email</small><h3>${escapeHtml(user.email || "Disamarkan / belum diisi")}</h3></div><div><small>Telepon</small><h3>${escapeHtml(user.phone || "Disamarkan / belum diisi")}</h3></div><div><small>Status</small><h3>${status(user.status)}</h3></div></div></div></section><aside class="card"><div class="card-header"><h2>Role Akses</h2></div><div class="card-body"><div class="page-actions">${roles.map((role) => status(role)).join("")}</div><p class="cell-sub" style="margin-top:16px">Role dan session berasal dari endpoint auth lama; aplikasi tidak membuat autentikasi baru.</p></div></aside></div>`;
	},
};

export const settingsPage = {
	active: "settings",
	async load() {
		const [payments, communications] = await Promise.all([
			api.get("/providers"),
			api.get("/providers/communications"),
		]);
		return { providers: { ...(payments.providers || {}), ...(communications.providers || {}) } };
	},
	render(data) {
		return `${pageHeader("Pengaturan", "Status integrasi operasional")}
			<div class="grid grid-3">${Object.entries(data.providers || {}).map(([key, provider]) => `<article class="card"><div class="card-body"><div class="record-top"><h2>${escapeHtml(key.toUpperCase())}</h2>${status(provider.configured ? "active" : "inactive")}</div><p class="cell-sub" style="margin-top:10px">Mode: ${escapeHtml(provider.mode)}</p></div></article>`).join("")}</div><div class="alert" style="margin-top:20px"><div><strong>Integrasi eksternal bersifat eksplisit</strong><p>WhatsApp, email, QRIS, dan R2 tidak akan dilaporkan berhasil jika credential atau resource belum tersedia.</p></div></div>`;
	},
};

export const notFoundPage = {
	public: true,
	active: "none",
	render() { return `<main class="boot-screen"><div class="state-icon">404</div><h1>Halaman tidak ditemukan</h1><p>Alamat yang Anda buka tidak tersedia.</p><a class="btn" href="#/dashboard">Kembali ke Dashboard</a></main>`; },
};
