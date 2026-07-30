import { api } from "../api/client.js";
import { currentRoles } from "../state/session.js";
import { dateTime, escapeHtml, money, pageHeader, status } from "../components/ui.js";

function kpi(icon, label, value, hint = "") {
	return `<article class="card kpi-card"><div class="kpi-top"><span class="kpi-icon">${icon}</span>${hint ? `<small>${escapeHtml(hint)}</small>` : ""}</div><div><div class="kpi-label">${escapeHtml(label)}</div><div class="kpi-value">${value}</div></div></article>`;
}

export const dashboardPage = {
	active: "dashboard",
	async load() {
		const dashboard = await api.get("/dashboard");
		let orders = { items: [] };
		if (currentRoles().some((role) => ["admin", "hyperuser", "mechanic"].includes(role))) orders = await api.get("/service-orders?limit=20");
		return { dashboard: dashboard.dashboard, orders: orders.items || [] };
	},
	render({ dashboard: data, orders }) {
		const flow = Object.fromEntries((data.workflow || []).map((item) => [item.status, Number(item.total)]));
		const columns = ["waiting", "inspection", "approval", "in_progress", "quality_check", "ready"];
		const canBook = currentRoles().some((role) => ["admin", "hyperuser"].includes(role));
		return `${pageHeader("Dashboard", "Ringkasan operasional 21 Motoshop hari ini", canBook ? '<a class="btn" href="#/bookings/new">+ Booking Baru</a>' : "")}
			<section class="grid grid-4" aria-label="Indikator utama">
				${kpi("Rp", "Pendapatan Hari Ini", money(data.revenue?.value), "D1 terbayar")}
				${kpi("SO", "Service Order Hari Ini", Number(data.orders?.total || 0), `${Number(data.orders?.completed || 0)} selesai`)}
				${kpi("MK", "Mekanik Tersedia", `${Number(data.mechanics?.available || 0)} / ${Number(data.mechanics?.total || 0)}`, "Siap ditugaskan")}
				${kpi("KD", "Kendaraan di Bengkel", Number(data.vehicles?.total || 0), "Aktif")}
			</section>
			<div class="detail-grid dashboard-grid" style="margin-top:20px">
				<section class="card"><div class="card-header"><h2>Alur Service</h2><a class="btn btn-ghost btn-sm" href="#/service-orders">Lihat Semua &rarr;</a></div><div class="card-body workflow-body"><div class="workflow">
					${columns.map((column) => `<div class="workflow-column"><div class="workflow-title"><span>${escapeHtml(column.replaceAll("_", " "))}</span><span>${flow[column] || 0}</span></div><div class="workflow-items">${orders.filter((order) => order.status === column).slice(0, 3).map((order) => `<a class="workflow-card" href="#/service-orders/${encodeURIComponent(order.id)}"><strong>${escapeHtml(order.order_no)}</strong><span class="cell-sub">${escapeHtml(`${order.brand} ${order.model}`)}</span><span class="cell-sub">${escapeHtml(order.license_plate)}</span></a>`).join("") || '<small class="workflow-empty">Belum ada antrean</small>'}</div></div>`).join("")}
				</div></div></section>
				<aside class="card attention-card"><div class="card-header"><h2>Perlu Perhatian</h2></div><div class="attention-list">
					<a class="attention-item" href="#/spare-parts?stock=critical"><span class="attention-dot">!</span><div><strong>${Number(data.low_stock?.critical || 0)} stok kritis</strong><span class="cell-sub">${Number(data.low_stock?.total || 0)} item di bawah minimum</span></div></a>
					${canBook ? `<a class="attention-item" href="#/bookings"><span class="attention-dot">BK</span><div><strong>${Number(data.bookings?.total || 0)} booking hari ini</strong><span class="cell-sub">Periksa jadwal berikutnya</span></div></a>` : ""}
					${orders[0] ? `<a class="attention-item" href="#/service-orders/${encodeURIComponent(orders[0].id)}"><span class="attention-dot">SO</span><div><strong>${escapeHtml(orders[0].order_no)}</strong><span class="attention-meta">${status(orders[0].status)} <small>${dateTime(orders[0].created_at)}</small></span></div></a>` : ""}
				</div></aside>
			</div>`;
	},
};
