import { currentRoles, currentUser } from "../state/session.js";
import { escapeHtml, initials } from "./ui.js";
import { api } from "../api/client.js";

let unreadCache = { value: 0, expiresAt: 0, promise: null };

const NAV = {
	admin: [
		["dashboard", "DB", "Dashboard", "#/dashboard"], ["bookings", "BK", "Booking", "#/bookings"],
		["service-orders", "SO", "Service Order", "#/service-orders"], ["customers", "PL", "Pelanggan", "#/customers"],
		["vehicles", "KD", "Kendaraan", "#/vehicles"], ["mechanics", "MK", "Mekanik", "#/mechanics"],
		["spare-parts", "SP", "Spare Parts", "#/spare-parts"], ["inventory", "IN", "Penerimaan", "#/inventory/receipts"],
		["suppliers", "SU", "Supplier", "#/suppliers"],
		["cashier", "KS", "Kasir / POS", "#/cashier"], ["transactions", "TR", "Transaksi", "#/transactions"],
		["reports", "LP", "Laporan", "#/reports"], ["activity", "LG", "Log Aktivitas", "#/activity"],
	],
	mechanic: [
		["dashboard", "DB", "Dashboard", "#/dashboard"], ["my-work", "PK", "Pekerjaan Saya", "#/my-work"],
		["service-orders", "SO", "Service Order", "#/service-orders"], ["history", "RS", "Riwayat Service", "#/service-orders?status=completed"],
		["notifications", "NT", "Notifikasi", "#/notifications"],
	],
	cashier: [
		["dashboard", "DB", "Dashboard", "#/dashboard"], ["cashier", "KS", "Kasir / POS", "#/cashier"],
		["transactions", "TR", "Transaksi", "#/transactions"], ["customers", "PL", "Pelanggan", "#/customers"],
		["notifications", "NT", "Notifikasi", "#/notifications"],
	],
};

function primaryRole() {
	const roles = currentRoles();
	if (roles.includes("admin") || roles.includes("hyperuser")) return "admin";
	if (roles.includes("mechanic")) return "mechanic";
	if (roles.includes("cashier")) return "cashier";
	return "admin";
}

function navItems(active) {
	return NAV[primaryRole()].map(([key, icon, label, href]) => `<a class="nav-item ${active === key ? "active" : ""}" href="${href}" data-nav><span class="nav-icon">${icon}</span><span>${label}</span></a>`).join("");
}

export function shell(content, active = "dashboard") {
	const user = currentUser() || {};
	return `<div class="app-shell">
		<button class="sidebar-scrim" id="sidebar-scrim" aria-label="Tutup navigasi"></button>
		<aside class="sidebar" id="sidebar" aria-label="Navigasi utama">
			<div class="brand"><div class="brand-mark">21</div><div><strong>21 Motoshop</strong><small>Workshop Management</small></div></div>
			<a class="btn btn-sm" href="#/bookings/new" ${primaryRole() !== "admin" ? "hidden" : ""}>＋ Booking Baru</a>
			<nav class="nav-group">${navItems(active)}</nav>
			<div class="sidebar-footer nav-group">
				<a class="nav-item ${active === "notifications" ? "active" : ""}" href="#/notifications"><span class="nav-icon">NT</span><span>Notifikasi</span></a>
				<a class="nav-item ${active === "profile" ? "active" : ""}" href="#/profile"><span class="nav-icon">PR</span><span>Profil</span></a>
				<a class="nav-item ${active === "settings" ? "active" : ""}" href="#/settings"><span class="nav-icon">PG</span><span>Pengaturan</span></a>
			</div>
		</aside>
		<div class="workspace">
			<header class="topbar">
				<div style="display:flex;align-items:center;gap:10px"><button class="icon-btn mobile-menu" id="menu-toggle" aria-label="Buka navigasi">☰</button><div class="input-icon topbar-search"><span>⌕</span><input class="input" id="global-search" placeholder="Cari order, pelanggan, atau sparepart…" aria-label="Pencarian global"></div></div>
				<div class="topbar-actions"><a class="icon-btn notification-link" href="#/notifications" aria-label="Notifikasi">◎<span class="notification-badge" id="notification-badge" hidden></span></a><a class="avatar" href="#/profile" title="${escapeHtml(user.display_name || user.username || "Profil")}">${escapeHtml(initials(user.display_name || user.username))}</a><button class="btn btn-secondary btn-sm" id="logout-button">Keluar</button></div>
			</header>
			<main class="content" id="main-content">${content}</main>
		</div>
	</div>`;
}

export function mountShell({ onLogout }) {
	const sidebar = document.querySelector("#sidebar");
	const scrim = document.querySelector("#sidebar-scrim");
	const close = () => { sidebar?.classList.remove("open"); scrim?.classList.remove("show"); };
	document.querySelector("#menu-toggle")?.addEventListener("click", () => { sidebar?.classList.toggle("open"); scrim?.classList.toggle("show"); });
	scrim?.addEventListener("click", close);
	document.querySelectorAll("[data-nav]").forEach((link) => link.addEventListener("click", close));
	document.querySelector("#logout-button")?.addEventListener("click", onLogout);
	document.querySelector("#global-search")?.addEventListener("keydown", (event) => {
		if (event.key === "Enter" && event.target.value.trim()) location.hash = `#/service-orders?q=${encodeURIComponent(event.target.value.trim())}`;
	});
	const renderBadge = (count) => {
		const badge = document.querySelector("#notification-badge");
		if (!badge || !count) return;
		badge.textContent = count > 99 ? "99+" : String(count);
		badge.hidden = false;
	};
	if (unreadCache.expiresAt > Date.now()) renderBadge(unreadCache.value);
	else {
		unreadCache.promise ||= api.get("/notifications?unread=true&limit=1")
			.then((data) => {
				unreadCache = { value: Number(data.unread || 0), expiresAt: Date.now() + 30000, promise: null };
				return unreadCache.value;
			})
			.catch(() => { unreadCache.promise = null; return 0; });
		unreadCache.promise.then(renderBadge);
	}
}
