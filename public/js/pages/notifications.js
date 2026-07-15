import { api } from "../api/client.js";
import { dateTime, emptyState, escapeHtml, pageHeader, toast } from "../components/ui.js";

export const notificationsPage = {
	active: "notifications",
	async load() { return api.get("/notifications?limit=100"); },
	render(data) {
		const items = data.items || [];
		return `${pageHeader("Notifikasi", `${Number(data.unread || 0)} notifikasi belum dibaca`, items.length ? '<button class="btn btn-secondary" id="read-all">Tandai Semua Dibaca</button>' : "")}
			<section class="card">${items.length ? items.map((item) => `<article class="notification-item ${item.read_at ? "" : "unread"}"><div class="notification-icon">${escapeHtml(item.type.slice(0, 2).toUpperCase())}</div><div class="notification-body"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.message)}</p><div class="notification-meta"><span>${dateTime(item.created_at)}</span><span>•</span><span>${escapeHtml(item.severity)}</span></div></div><div class="page-actions">${item.action_url ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(item.action_url)}">Buka</a>` : ""}${!item.read_at ? `<button class="btn btn-ghost btn-sm" data-read="${escapeHtml(item.id)}">Tandai dibaca</button>` : ""}</div></article>`).join("") : emptyState("Tidak ada notifikasi", "Pusat notifikasi Anda bersih.")}</section>`;
	},
	mount() {
		const refresh = () => location.reload();
		document.querySelectorAll("[data-read]").forEach((button) => button.addEventListener("click", async () => { try { await api.post(`/notifications/${encodeURIComponent(button.dataset.read)}/read`); refresh(); } catch (error) { toast(error.message, "error"); } }));
		document.querySelector("#read-all")?.addEventListener("click", async () => { try { await api.post("/notifications/read-all"); toast("Semua notifikasi ditandai dibaca", "success"); refresh(); } catch (error) { toast(error.message, "error"); } });
	},
};
