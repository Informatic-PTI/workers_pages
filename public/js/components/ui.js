export function escapeHtml(value) {
	return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

export function money(value) {
	return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function dateTime(value, options = {}) {
	if (!value) return "—";
	const date = new Date(String(value).includes("Z") || String(value).includes("+") ? value : `${String(value).replace(" ", "T")}Z`);
	if (Number.isNaN(date.getTime())) return escapeHtml(value);
	return new Intl.DateTimeFormat("id-ID", { dateStyle: options.dateOnly ? "medium" : "medium", ...(options.dateOnly ? {} : { timeStyle: "short" }) }).format(date);
}

export function status(value) {
	const raw = String(value || "unknown");
	const label = {
		in_progress: "Dikerjakan", quality_check: "Quality Check", waiting: "Menunggu", inspection: "Pemeriksaan",
		approval: "Persetujuan", ready: "Siap Diambil", completed: "Selesai", scheduled: "Terjadwal",
		confirmed: "Terkonfirmasi", checked_in: "Check-in", paid: "Lunas", unpaid: "Belum Dibayar",
		critical: "Kritis", low: "Stok Rendah", safe: "Aman", active: "Aktif", inactive: "Nonaktif",
		available: "Tersedia", busy: "Sibuk", off_duty: "Tidak Bertugas", posted: "Tercatat",
		cancelled: "Dibatalkan", no_show: "Tidak Hadir", failed: "Gagal", expired: "Kedaluwarsa",
	}[raw] || raw.replaceAll("_", " ");
	return `<span class="status status-${escapeHtml(raw)}">${escapeHtml(label)}</span>`;
}

export function initials(name) {
	return String(name || "U").split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

export function emptyState(title = "Belum ada data", message = "Data akan muncul di sini setelah tersedia.") {
	return `<div class="empty-state"><div class="state-icon">—</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(message)}</p></div>`;
}

export function errorState(error, retryId = "retry-page") {
	return `<div class="error-state"><div class="state-icon">!</div><h3>Data tidak dapat dimuat</h3><p>${escapeHtml(error?.message || "Terjadi kesalahan")}</p><button class="btn btn-secondary" id="${retryId}">Coba lagi</button></div>`;
}

export function pageHeader(title, description, actions = "") {
	return `<header class="page-header"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</header>`;
}

export function toast(message, type = "info", duration = 4200) {
	const region = document.querySelector("#toast-region");
	if (!region) return;
	const item = document.createElement("div");
	item.className = `toast ${type}`;
	item.innerHTML = `<div><strong>${type === "error" ? "Gagal" : type === "success" ? "Berhasil" : "Informasi"}</strong><div>${escapeHtml(message)}</div></div>`;
	region.append(item);
	setTimeout(() => item.remove(), duration);
}

export function confirmDialog({ title, message, confirmText = "Lanjutkan", danger = false }) {
	return new Promise((resolve) => {
		const dialog = document.createElement("dialog");
		dialog.className = "modal";
		dialog.innerHTML = `<div class="modal-header"><h2>${escapeHtml(title)}</h2></div><div class="modal-body"><p>${escapeHtml(message)}</p></div><div class="modal-footer"><button class="btn btn-secondary" value="cancel">Batal</button><button class="btn ${danger ? "btn-danger" : ""}" value="confirm">${escapeHtml(confirmText)}</button></div>`;
		dialog.addEventListener("click", (event) => { if (event.target.matches("button[value]")) dialog.close(event.target.value); });
		dialog.addEventListener("close", () => { resolve(dialog.returnValue === "confirm"); dialog.remove(); });
		document.body.append(dialog);
		dialog.showModal();
	});
}

export function formDataObject(form) {
	return Object.fromEntries(new FormData(form).entries());
}

export function idFromPath(path) {
	return decodeURIComponent(path.split("/").filter(Boolean).at(-1) || "");
}
