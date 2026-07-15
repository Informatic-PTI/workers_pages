import { loginPage } from "./pages/login.js";
import { dashboardPage } from "./pages/dashboard.js";
import { bookingDetailPage, bookingNewPage, bookingsPage } from "./pages/bookings.js";
import { customerDetailPage, customersPage, vehicleDetailPage, vehiclesPage } from "./pages/customers.js";
import { myWorkPage, serviceOrderDetailPage, serviceOrdersPage } from "./pages/serviceOrders.js";
import {
	sparePartDetailPage, sparePartsPage, stockInPage, stockReceiptDetailPage, stockReceiptsPage, suppliersPage,
} from "./pages/inventory.js";
import { cashierPage, invoiceDetailPage, qrisPage, transactionsPage } from "./pages/cashier.js";
import { reportsPage } from "./pages/reports.js";
import { notificationsPage } from "./pages/notifications.js";
import { activityPage, mechanicsPage, notFoundPage, profilePage, settingsPage } from "./pages/misc.js";
import { errorState, toast } from "./components/ui.js";
import { mountShell, shell } from "./components/shell.js";
import { loadProfile, logout } from "./services/auth.js";
import { clearSession, currentRoles, isAuthenticated } from "./state/session.js";
import { navigate, onRoute, registerRoute, startRouter } from "./router.js";

const app = document.querySelector("#app");
let navigationVersion = 0;

registerRoute("/login", loginPage);
registerRoute("/dashboard", dashboardPage, { roles: ["admin", "mechanic", "cashier"] });
registerRoute("/bookings", bookingsPage, { roles: ["admin"] });
registerRoute("/bookings/new", bookingNewPage, { roles: ["admin"] });
registerRoute("/bookings/:id", bookingDetailPage, { roles: ["admin"] });
registerRoute("/customers", customersPage, { roles: ["admin", "cashier"] });
registerRoute("/customers/:id", customerDetailPage, { roles: ["admin", "cashier"] });
registerRoute("/vehicles", vehiclesPage, { roles: ["admin", "cashier"] });
registerRoute("/vehicles/:id", vehicleDetailPage, { roles: ["admin", "cashier"] });
registerRoute("/mechanics", mechanicsPage, { roles: ["admin"] });
registerRoute("/service-orders", serviceOrdersPage, { roles: ["admin", "mechanic"] });
registerRoute("/service-orders/:id", serviceOrderDetailPage, { roles: ["admin", "mechanic"] });
registerRoute("/my-work", myWorkPage, { roles: ["admin", "mechanic"] });
registerRoute("/spare-parts", sparePartsPage, { roles: ["admin", "mechanic"] });
registerRoute("/spare-parts/:id", sparePartDetailPage, { roles: ["admin", "mechanic"] });
registerRoute("/inventory/stock-in", stockInPage, { roles: ["admin"] });
registerRoute("/inventory/receipts", stockReceiptsPage, { roles: ["admin"] });
registerRoute("/inventory/receipts/:id", stockReceiptDetailPage, { roles: ["admin"] });
registerRoute("/suppliers", suppliersPage, { roles: ["admin"] });
registerRoute("/cashier", cashierPage, { roles: ["admin", "cashier"] });
registerRoute("/cashier/qris/:id", qrisPage, { roles: ["admin", "cashier"] });
registerRoute("/cashier/:id", invoiceDetailPage, { roles: ["admin", "cashier"] });
registerRoute("/transactions", transactionsPage, { roles: ["admin", "cashier"] });
registerRoute("/reports", reportsPage, { roles: ["admin"] });
registerRoute("/notifications", notificationsPage, { roles: ["admin", "mechanic", "cashier"] });
registerRoute("/activity", activityPage, { roles: ["admin"] });
registerRoute("/profile", profilePage, { roles: ["admin", "mechanic", "cashier"] });
registerRoute("/settings", settingsPage, { roles: ["admin", "mechanic", "cashier"] });

async function handleLogout() {
	await logout();
	toast("Anda telah keluar", "success");
	navigate("/login", { replace: true });
}

async function renderRoute(route) {
	const version = ++navigationVersion;
	if (!route) route = { page: notFoundPage, path: location.hash };
	const page = route.page;
	if (!page.public && !isAuthenticated()) { navigate("/login", { replace: true }); return; }
	if (page.public && route.path === "/login" && isAuthenticated()) { navigate("/dashboard", { replace: true }); return; }
	if (!page.public && route.roles?.length) {
		const roles = new Set(currentRoles());
		if (roles.has("hyperuser")) roles.add("admin");
		if (!route.roles.some((role) => roles.has(role))) {
			app.innerHTML = shell('<div class="error-state"><div class="state-icon">403</div><h3>Akses ditolak</h3><p>Role akun Anda tidak memiliki akses ke halaman ini.</p><a class="btn btn-secondary" href="#/dashboard">Kembali ke Dashboard</a></div>', page.active);
			mountShell({ onLogout: handleLogout });
			return;
		}
	}

	if (page.public) app.innerHTML = page.render(null, route);
	else app.innerHTML = shell('<div class="card"><div class="loading-state"><div class="spinner"></div><p>Memuat data…</p></div></div>', page.active);
	if (!page.public) mountShell({ onLogout: handleLogout });

	try {
		const data = page.load ? await page.load(route) : null;
		if (version !== navigationVersion) return;
		app.innerHTML = page.public ? page.render(data, route) : shell(page.render(data, route), page.active);
		if (!page.public) mountShell({ onLogout: handleLogout });
		await page.mount?.(data, route);
		document.querySelector("#main-content")?.focus({ preventScroll: true });
	} catch (error) {
		if (version !== navigationVersion) return;
		if (error.status === 401) { clearSession(); navigate("/login", { replace: true }); return; }
		const content = errorState(error);
		app.innerHTML = page.public ? content : shell(content, page.active);
		if (!page.public) mountShell({ onLogout: handleLogout });
		document.querySelector("#retry-page")?.addEventListener("click", () => renderRoute(route));
	}
}

onRoute(renderRoute);

async function bootstrap() {
	if (isAuthenticated()) {
		try { await loadProfile(); } catch (error) { if (error.status === 401) clearSession(); }
	}
	startRouter();
}

bootstrap();
