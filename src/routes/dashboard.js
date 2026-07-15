const html = (strings, ...values) =>
	strings.reduce((out, str, i) => out + str + (values[i] ?? ""), "");

export function handleDashboard() {
	return new Response(html`<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Irwan Motor Auth Dashboard</title>
	<style>
		:root {
			color-scheme: dark;
			--bg: #090b10;
			--bg-soft: #0e1118;
			--panel: rgba(23, 27, 36, .92);
			--panel-2: #1d2330;
			--panel-3: #111722;
			--line: rgba(148, 163, 184, .18);
			--line-strong: rgba(148, 163, 184, .32);
			--text: #f8fafc;
			--muted: #94a3b8;
			--muted-2: #64748b;
			--accent: #34d399;
			--accent-dark: #059669;
			--accent-soft: rgba(52, 211, 153, .13);
			--info: #60a5fa;
			--info-soft: rgba(96, 165, 250, .12);
			--warn: #f59e0b;
			--warn-soft: rgba(245, 158, 11, .12);
			--danger: #fb7185;
			--danger-soft: rgba(251, 113, 133, .12);
			--radius: 16px;
			--radius-sm: 11px;
			--shadow-soft: 0 10px 26px rgba(0, 0, 0, .18);
			--sidebar: 280px;
			font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		}

		* {
			box-sizing: border-box;
		}

		html {
			min-width: 0;
			background: var(--bg);
		}

		body {
			margin: 0;
			min-height: 100vh;
			min-width: 0;
			color: var(--text);
			background:
				radial-gradient(circle at top left, rgba(52, 211, 153, .12), transparent 34vw),
				radial-gradient(circle at top right, rgba(96, 165, 250, .11), transparent 30vw),
				linear-gradient(180deg, #090b10 0%, #0b0f17 100%);
			overflow-x: hidden;
		}

		button,
		input,
		select,
		textarea {
			font: inherit;
		}

		button {
			border: 1px solid var(--line);
			background: linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015));
			color: var(--text);
			border-radius: 12px;
			padding: 10px 13px;
			cursor: pointer;
			min-height: 42px;
			transition: transform .12s ease, border-color .12s ease, background .12s ease, opacity .12s ease;
			touch-action: manipulation;
		}

		button:hover {
			transform: translateY(-1px);
			border-color: var(--line-strong);
			background: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.025));
		}

		button:active {
			transform: translateY(0);
		}

		button.primary {
			background: linear-gradient(180deg, #5eead4, var(--accent));
			border-color: rgba(52, 211, 153, .95);
			color: #042014;
			font-weight: 800;
		}

		button.warn {
			border-color: rgba(245, 158, 11, .55);
			background: var(--warn-soft);
			color: #fde68a;
		}

		button.danger {
			border-color: rgba(251, 113, 133, .55);
			background: var(--danger-soft);
			color: #fecdd3;
		}

		button:disabled {
			opacity: .5;
			cursor: not-allowed;
			transform: none;
		}

		input,
		select,
		textarea {
			width: 100%;
			min-width: 0;
			border: 1px solid var(--line);
			background: rgba(8, 11, 17, .88);
			color: var(--text);
			border-radius: 12px;
			padding: 11px 12px;
			outline: none;
			min-height: 42px;
			transition: border-color .12s ease, box-shadow .12s ease, background .12s ease;
		}

		input:focus,
		select:focus,
		textarea:focus {
			border-color: rgba(52, 211, 153, .68);
			box-shadow: 0 0 0 4px rgba(52, 211, 153, .10);
			background: rgba(6, 9, 14, .95);
		}

		textarea {
			min-height: 112px;
			resize: vertical;
			line-height: 1.45;
		}

		label {
			display: grid;
			gap: 7px;
			color: var(--muted);
			font-size: 12px;
			line-height: 1.45;
			min-width: 0;
		}

		.app {
			display: grid;
			grid-template-columns: var(--sidebar) minmax(0, 1fr);
			min-height: 100vh;
			min-width: 0;
		}

		.sidebar {
			border-right: 1px solid var(--line);
			background: rgba(7, 10, 16, .82);
			backdrop-filter: blur(18px);
			padding: 20px;
			position: sticky;
			top: 0;
			height: 100vh;
			overflow: auto;
		}

		.brand {
			font-size: 19px;
			font-weight: 900;
			letter-spacing: -.02em;
			margin-bottom: 4px;
		}

		.sub {
			color: var(--muted);
			font-size: 12px;
			line-height: 1.55;
			word-break: break-word;
		}

		.nav {
			display: grid;
			gap: 8px;
			margin: 24px 0;
		}

		.nav button {
			text-align: left;
			background: transparent;
			border-color: transparent;
			color: var(--muted);
			font-weight: 700;
		}

		.nav button:hover {
			color: var(--text);
			border-color: var(--line);
		}

		.nav button.active {
			background: linear-gradient(180deg, rgba(52, 211, 153, .16), rgba(52, 211, 153, .07));
			border-color: rgba(52, 211, 153, .30);
			color: #d1fae5;
		}

		.sessionBox {
			display: grid;
			gap: 10px;
			margin-top: 18px;
			padding-top: 18px;
			border-top: 1px solid var(--line);
		}

		main {
			padding: 22px;
			width: 100%;
			min-width: 0;
			max-width: 1520px;
		}

		.topbar {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 14px;
			margin-bottom: 18px;
			min-width: 0;
		}

		h1 {
			margin: 0;
			font-size: clamp(22px, 2.2vw, 30px);
			letter-spacing: -.035em;
			line-height: 1.1;
		}

		h2 {
			margin: 0 0 14px;
			font-size: 15px;
			letter-spacing: -.01em;
		}

		.grid {
			display: grid;
			gap: 14px;
			min-width: 0;
		}

		.stats {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.two {
			grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);
		}

		.panel {
			min-width: 0;
			background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.015)), var(--panel);
			border: 1px solid var(--line);
			border-radius: var(--radius);
			box-shadow: var(--shadow-soft);
			padding: 16px;
			overflow: hidden;
		}

		.stat {
			position: relative;
			min-height: 102px;
			padding: 16px;
		}

		.stat::before {
			content: "";
			position: absolute;
			left: 0;
			top: 16px;
			bottom: 16px;
			width: 4px;
			border-radius: 999px;
			background: var(--accent);
		}

		.stat:nth-child(2)::before { background: var(--info); }
		.stat:nth-child(3)::before { background: var(--warn); }
		.stat:nth-child(4)::before { background: var(--danger); }

		.value {
			font-size: clamp(28px, 3vw, 40px);
			font-weight: 900;
			letter-spacing: -.04em;
			margin-top: 10px;
		}

		.toolbar {
			display: flex;
			align-items: end;
			gap: 10px;
			flex-wrap: wrap;
			margin-bottom: 14px;
			min-width: 0;
		}

		.toolbar > * {
			min-width: min(190px, 100%);
		}

		.tableWrap {
			width: 100%;
			max-width: 100%;
			overflow-x: auto;
			border: 1px solid var(--line);
			border-radius: 14px;
			background: rgba(8, 11, 17, .38);
		}

		table {
			width: 100%;
			min-width: 760px;
			border-collapse: collapse;
			font-size: 13px;
		}

		th,
		td {
			border-bottom: 1px solid var(--line);
			padding: 10px 10px;
			text-align: left;
			vertical-align: top;
			max-width: 360px;
			word-break: break-word;
		}

		th {
			position: sticky;
			top: 0;
			background: #111722;
			color: var(--muted);
			font-size: 11px;
			font-weight: 800;
			text-transform: uppercase;
			letter-spacing: .04em;
			z-index: 1;
		}

		tr:hover td {
			background: rgba(255, 255, 255, .025);
		}

		.badge {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			min-height: 24px;
			max-width: 100%;
			padding: 3px 8px;
			border-radius: 999px;
			border: 1px solid var(--line);
			color: var(--muted);
			font-size: 12px;
			line-height: 1.25;
			white-space: nowrap;
		}

		.badge.good {
			color: #bbf7d0;
			background: var(--accent-soft);
			border-color: rgba(52, 211, 153, .42);
		}

		.badge.bad {
			color: #fecdd3;
			background: var(--danger-soft);
			border-color: rgba(251, 113, 133, .44);
		}

		.badge.warn {
			color: #fde68a;
			background: var(--warn-soft);
			border-color: rgba(245, 158, 11, .44);
		}

		.status-loading {
			color: #bfdbfe;
			background: var(--info-soft);
			border-color: rgba(96, 165, 250, .44);
		}

		.status-ok {
			color: #bbf7d0;
			background: var(--accent-soft);
			border-color: rgba(52, 211, 153, .44);
		}

		.status-error {
			color: #fecdd3;
			background: var(--danger-soft);
			border-color: rgba(251, 113, 133, .44);
		}

		.formgrid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 12px;
			min-width: 0;
		}

		.formgrid .full {
			grid-column: 1 / -1;
		}

		.hidden {
			display: none !important;
		}

		.notice {
			border: 1px solid rgba(245, 158, 11, .38);
			color: #fde68a;
			background: rgba(245, 158, 11, .08);
			border-radius: 14px;
			padding: 12px 13px;
			margin-bottom: 14px;
			font-size: 13px;
			line-height: 1.45;
		}

		.output {
			white-space: pre-wrap;
			overflow-wrap: anywhere;
			word-break: break-word;
			background: rgba(7, 10, 16, .78);
			border: 1px solid var(--line);
			border-radius: 14px;
			padding: 12px;
			max-height: 440px;
			overflow: auto;
			font-size: 12px;
			line-height: 1.45;
		}

		.login {
			min-height: 100vh;
			display: grid;
			place-items: center;
			padding: 18px;
		}

		.login .panel {
			width: min(460px, 100%);
			padding: 22px;
		}

		.login h1 {
			margin-bottom: 6px;
		}

		.actionRow {
			display: flex;
			gap: 10px;
			flex-wrap: wrap;
			align-items: center;
		}

		.actionRow > * {
			flex: 0 0 auto;
		}

		.stack {
			display: grid;
			gap: 12px;
		}

		@media (max-width: 1180px) {
			.stats {
				grid-template-columns: repeat(2, minmax(0, 1fr));
			}

			.two {
				grid-template-columns: 1fr;
			}
		}

		@media (max-width: 860px) {
			.app {
				grid-template-columns: 1fr;
			}

			.sidebar {
				position: static;
				height: auto;
				border-right: 0;
				border-bottom: 1px solid var(--line);
				padding: 14px;
			}

			.nav {
				display: flex;
				gap: 8px;
				overflow-x: auto;
				margin: 16px 0;
				padding-bottom: 4px;
				scrollbar-width: thin;
			}

			.nav button {
				white-space: nowrap;
				min-width: max-content;
			}

			.sessionBox {
				grid-template-columns: 1fr auto auto;
				align-items: center;
				margin-top: 12px;
				padding-top: 12px;
			}

			main {
				padding: 14px;
			}

			.formgrid {
				grid-template-columns: 1fr;
			}

			.toolbar {
				display: grid;
				grid-template-columns: 1fr;
			}

			.toolbar > * {
				width: 100%;
				min-width: 0;
			}
		}

		@media (max-width: 560px) {
			.stats {
				grid-template-columns: 1fr;
			}

			.panel {
				padding: 13px;
				border-radius: 14px;
			}

			.sessionBox {
				grid-template-columns: 1fr;
			}

			.topbar {
				display: grid;
				grid-template-columns: 1fr;
			}

			#status {
				justify-self: start;
			}

			table {
				min-width: 680px;
			}

			button {
				width: 100%;
			}

			.actionRow button {
				width: auto;
				flex: 1 1 140px;
			}
		}
	</style>
</head>
<body>
	<div id="login" class="login">
		<section class="panel">
			<h1>Hyperdashboard</h1>
			<p class="sub">Masuk ke panel admin.</p>
			<div id="loginNotice" class="notice hidden"></div>
			<div class="grid">
				<label>Identifier<input id="identifier" autocomplete="username" placeholder="Username or email"></label>
				<label>Password<input id="password" type="password" autocomplete="current-password"></label>
				<div id="otpWrap" class="hidden">
					<label>OTP<input id="otp" inputmode="numeric" autocomplete="one-time-code"></label>
					<div id="otpDeliveryStatus" class="sub" role="status">Menyiapkan OTP...</div>
					<button id="resendOtpBtn" type="button">Kirim ulang OTP</button>
				</div>
				<button id="loginBtn" class="primary">Login</button>
			</div>
		</section>
	</div>

	<div id="app" class="app hidden">
		<aside class="sidebar">
			<div class="brand">Irwan Motor Auth</div>
			<div class="sub">Hyperdashboard</div>
			<nav class="nav" id="nav"></nav>
			<div class="sessionBox">
				<div class="sub" id="actor">No actor</div>
				<button id="refreshBtn">Refresh</button>
				<button id="logoutBtn" class="danger">Logout</button>
			</div>
		</aside>

		<main>
			<div class="topbar">
				<div>
					<h1 id="title">Overview</h1>
					<div class="sub" id="subtitle">Auth control surface</div>
				</div>
				<div id="status" class="badge">idle</div>
			</div>
			<div id="view"></div>
		</main>
	</div>

	<script>
		const state = {
			accessToken: sessionStorage.getItem("irwanmotor.auth.access") || "",
			refreshToken: sessionStorage.getItem("irwanmotor.auth.refresh") || "",
			challengeId: "",
			otpPollTimer: null,
			actor: null,
			view: "overview",
			selectedUser: "",
		};

		const views = [
			["overview", "Overview"],
			["users", "Users"],
			["settings", "Settings"],
			["otp", "OTP"],
			["audit", "Audit"],
			["kv", "KV"],
			["infra", "Infra"],
		];

		const $ = (id) => document.getElementById(id);

		const api = async (path, options = {}) => {
			setStatus("loading");

			const res = await fetch(path, {
				...options,
				headers: {
					"content-type": "application/json",
					...(state.accessToken ? { authorization: "Bearer " + state.accessToken } : {}),
					...(options.headers || {}),
				},
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok || data.ok === false) {
				if (res.status === 401) showLogin();
				setStatus("error");
				throw new Error(data.message || data.code || "request_failed");
			}

			setStatus("ok");
			return data;
		};

		function setStatus(text) {
			const el = $("status");
			el.textContent = text;
			el.classList.remove("status-loading", "status-ok", "status-error");

			if (text === "loading") el.classList.add("status-loading");
			if (text === "ok") el.classList.add("status-ok");
			if (text === "error") el.classList.add("status-error");
		}

		function esc(value) {
			return String(value ?? "").replace(/[&<>"']/g, (c) => ({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			}[c]));
		}

		function badge(value) {
			const cls = value === true || value === "active" || value === "success"
				? "good"
				: value === "blocked" || value === "disabled" || value === "failure"
					? "bad"
					: "warn";

			return '<span class="badge ' + cls + '">' + esc(value) + '</span>';
		}

		function showLogin(message = "") {
			$("login").classList.remove("hidden");
			$("app").classList.add("hidden");

			if (message) {
				$("loginNotice").textContent = message;
				$("loginNotice").classList.remove("hidden");
			}
		}

		function showApp() {
			stopOtpPolling();
			$("login").classList.add("hidden");
			$("app").classList.remove("hidden");
			$("actor").textContent = state.actor ? state.actor.id + " - hyperuser" : "hyperuser";
		}

		function stopOtpPolling() {
			if (state.otpPollTimer) clearInterval(state.otpPollTimer);
			state.otpPollTimer = null;
		}

		function renderOtpDelivery(data) {
			const messages = {
				pending: "Menyiapkan OTP...",
				queued: "OTP sudah masuk antrean WhatsApp.",
				sending: "OTP sedang dikirim ke WhatsApp.",
				retrying: "Pengiriman OTP sedang dicoba ulang.",
				sent: "OTP berhasil dikirim ke WhatsApp.",
				failed: "OTP gagal dikirim. Gunakan tombol kirim ulang.",
			};
			const status = data.delivery_status || "pending";
			$("otpDeliveryStatus").textContent = messages[status] || messages.pending;
			const wait = Math.max(0, Number(data.retry_after_seconds || 0));
			$("resendOtpBtn").disabled = wait > 0 && !data.can_resend;
			$("resendOtpBtn").textContent = wait > 0 ? "Kirim ulang (" + wait + " dtk)" : "Kirim ulang OTP";
		}

		async function pollOtpStatus() {
			if (!state.challengeId) return;
			try {
				const res = await fetch("/auth/otp/status?challenge_id=" + encodeURIComponent(state.challengeId));
				const data = await res.json();
				if (!res.ok || !data.ok) return;
				renderOtpDelivery(data);
				if (data.expired) stopOtpPolling();
			} catch {
				// Status polling is informational; OTP verification stays available.
			}
		}

		function startOtpPolling() {
			stopOtpPolling();
			pollOtpStatus();
			state.otpPollTimer = setInterval(pollOtpStatus, 2000);
		}

		function renderNav() {
			let out = "";

			for (const item of views) {
				const id = item[0];
				const label = item[1];
				out += '<button data-view="' + esc(id) + '" class="' + (state.view === id ? "active" : "") + '">' + esc(label) + '</button>';
			}

			$("nav").innerHTML = out;

			document.querySelectorAll("[data-view]").forEach((button) => {
				button.onclick = () => {
					state.view = button.dataset.view;
					load();
				};
			});
		}

		function renderTable(rows, columns) {
			if (!rows.length) return '<div class="sub">No rows</div>';

			let head = "";
			for (const c of columns) {
				head += "<th>" + esc(c.label) + "</th>";
			}

			let body = "";
			for (const row of rows) {
				body += "<tr>";

				for (const c of columns) {
					body += "<td>";
					body += c.render ? c.render(row) : esc(row[c.key]);
					body += "</td>";
				}

				body += "</tr>";
			}

			return '<div class="tableWrap"><table><thead><tr>' +
				head +
				'</tr></thead><tbody>' +
				body +
				'</tbody></table></div>';
		}

		async function bootstrap() {
			if (!state.accessToken) return showLogin();

			try {
				const data = await api("/admin/dashboard/bootstrap");
				state.actor = data.actor;

				if (!state.actor?.is_hyperuser) return showLogin("Token bukan hyperuser.");

				showApp();
				renderNav();
				renderOverview(data.dashboard);
			} catch (error) {
				showLogin(error.message);
			}
		}

		function renderOverview(dashboard) {
			state.view = "overview";
			renderNav();

			$("title").textContent = "Overview";
			$("subtitle").textContent = "Live auth core snapshot";

			const c = dashboard.counts || {};

			$("view").innerHTML =
				'<div class="grid stats">' +
					'<section class="panel stat"><div class="sub">Users</div><div class="value">' + esc(c.users || 0) + '</div></section>' +
					'<section class="panel stat"><div class="sub">Active Sessions</div><div class="value">' + esc(dashboard.active_sessions || 0) + '</div></section>' +
					'<section class="panel stat"><div class="sub">Active OTP</div><div class="value">' + esc(dashboard.active_otp_challenges || 0) + '</div></section>' +
					'<section class="panel stat"><div class="sub">Audit Events</div><div class="value">' + esc(c.audit_events || 0) + '</div></section>' +
				'</div>' +
				'<div class="grid two" style="margin-top:14px">' +
					'<section class="panel"><h2>Recent Audit</h2>' +
						renderTable(dashboard.recent_audit || [], [
							{ key: "event_type", label: "Event" },
							{ key: "user_id", label: "User" },
							{ key: "outcome", label: "Outcome", render: (r) => badge(r.outcome) },
							{ key: "created_at", label: "Time" },
						]) +
					'</section>' +
					'<section class="panel"><h2>Bindings</h2><div class="grid">' +
						Object.entries(dashboard.bindings || {}).map(([k, v]) => '<div>' + badge(v) + " " + esc(k) + '</div>').join("") +
					'</div></section>' +
				'</div>';
		}

		async function renderUsers() {
			$("title").textContent = "Users";
			$("subtitle").textContent = "Create, edit, reset password, revoke sessions";

			$("view").innerHTML =
				'<section class="panel">' +
					'<div class="toolbar">' +
						'<label>Search<input id="userSearch" placeholder="id, email, phone, username"></label>' +
						'<button id="userSearchBtn">Search</button>' +
						'<button id="newUserBtn" class="primary">New User</button>' +
					'</div>' +
					'<div id="usersList"></div>' +
				'</section>' +
				'<div id="userDetail" style="margin-top:14px"></div>';

			$("userSearchBtn").onclick = loadUsersList;
			$("newUserBtn").onclick = showNewUser;

			await loadUsersList();
		}

		async function loadUsersList() {
			const q = $("userSearch")?.value || "";
			const data = await api("/admin/dashboard/users?q=" + encodeURIComponent(q));

			$("usersList").innerHTML = renderTable(data.users || [], [
				{ key: "id", label: "ID", render: (r) => '<button data-user="' + esc(r.id) + '">' + esc(r.id) + '</button>' },
				{ key: "email", label: "Email" },
				{ key: "phone", label: "Phone" },
				{ key: "username", label: "Username" },
				{ key: "status", label: "Status", render: (r) => badge(r.status) },
				{ key: "is_hyperuser", label: "Hyper", render: (r) => badge(Boolean(r.is_hyperuser)) },
				{ key: "skip_otp", label: "Skip OTP", render: (r) => badge(Boolean(r.skip_otp)) },
				{ key: "refresh_token_ttl_days", label: "Refresh TTL" },
			]);

			document.querySelectorAll("[data-user]").forEach((b) => {
				b.onclick = () => loadUserDetail(b.dataset.user);
			});
		}

		function showNewUser() {
			$("userDetail").innerHTML =
				'<section class="panel">' +
					'<h2>New User</h2>' +
					'<div class="formgrid">' +
						'<label>ID prefix<input id="nuPrefix" value="US"></label>' +
						'<label>Username<input id="nuUsername"></label>' +
						'<label>Email<input id="nuEmail"></label>' +
						'<label>Phone<input id="nuPhone"></label>' +
						'<label>Display name<input id="nuName"></label>' +
						'<label>Password<input id="nuPassword" type="password"></label>' +
						'<label>Status<select id="nuStatus"><option>active</option><option>blocked</option><option>disabled</option></select></label>' +
						'<label>Hyperuser<select id="nuHyper"><option value="false">false</option><option value="true">true</option></select></label>' +
						'<label>Skip OTP<select id="nuSkipOtp"><option value="false">false</option><option value="true">true</option></select></label>' +
						'<div class="sub full">Nomor WhatsApp wajib diisi jika Skip OTP = false.</div>' +
						'<div class="full"><button id="createUserBtn" class="primary">Create User</button></div>' +
					'</div>' +
				'</section>';

			$("createUserBtn").onclick = async () => {
				const body = {
					id_prefix: $("nuPrefix").value,
					username: $("nuUsername").value,
					email: $("nuEmail").value,
					phone: $("nuPhone").value,
					display_name: $("nuName").value,
					password: $("nuPassword").value,
					status: $("nuStatus").value,
					is_hyperuser: $("nuHyper").value === "true",
					settings: {
						skip_otp: $("nuSkipOtp").value === "true",
					},
				};

				const data = await api("/admin/dashboard/users", {
					method: "POST",
					body: JSON.stringify(body),
				});

				await loadUsersList();
				renderUserDetail(data);
			};
		}

		async function loadUserDetail(id) {
			const data = await api("/admin/dashboard/users/" + encodeURIComponent(id));
			renderUserDetail(data);
		}

		function renderUserDetail(data) {
			const u = data.user;
			state.selectedUser = u.id;

			$("userDetail").innerHTML =
				'<section class="panel">' +
					'<h2>User: ' + esc(u.id) + '</h2>' +
					'<div class="formgrid">' +
						'<label>Email<input id="duEmail" value="' + esc(u.email || "") + '"></label>' +
						'<label>Phone<input id="duPhone" value="' + esc(u.phone || "") + '"></label>' +
						'<label>Username<input id="duUsername" value="' + esc(u.username || "") + '"></label>' +
						'<label>Display name<input id="duName" value="' + esc(u.display_name || "") + '"></label>' +
						'<label>Status<select id="duStatus">' +
							'<option ' + (u.status === "active" ? "selected" : "") + '>active</option>' +
							'<option ' + (u.status === "blocked" ? "selected" : "") + '>blocked</option>' +
							'<option ' + (u.status === "disabled" ? "selected" : "") + '>disabled</option>' +
						'</select></label>' +
						'<label>Hyperuser<select id="duHyper">' +
							'<option value="false" ' + (!u.is_hyperuser ? "selected" : "") + '>false</option>' +
							'<option value="true" ' + (u.is_hyperuser ? "selected" : "") + '>true</option>' +
						'</select></label>' +
						'<label>Skip OTP<select id="duSkipOtp">' +
							'<option value="false" ' + (!u.skip_otp ? "selected" : "") + '>false</option>' +
							'<option value="true" ' + (u.skip_otp ? "selected" : "") + '>true</option>' +
						'</select></label>' +
						'<div class="sub full">Nomor WhatsApp wajib diisi jika Skip OTP = false.</div>' +
						'<label>Refresh TTL days<input id="duRefresh" type="number" min="1" max="365" value="' + esc(u.refresh_token_ttl_days || "") + '"></label>' +
						'<label>Access TTL seconds<input id="duAccess" type="number" min="60" max="86400" value="' + esc(u.access_token_ttl_seconds || "") + '"></label>' +
						'<label class="full">Notes<textarea id="duNotes">' + esc(u.auth_notes || "") + '</textarea></label>' +
					'</div>' +
					'<div class="toolbar" style="margin-top:12px">' +
						'<button id="saveUserBtn" class="primary">Save</button>' +
						'<button id="revokeAllBtn" class="danger">Revoke All Sessions</button>' +
						'<label>New password<input id="resetPassword" type="password"></label>' +
						'<button id="resetPasswordBtn" class="warn">Reset Password</button>' +
					'</div>' +
				'</section>' +
				'<div class="grid two" style="margin-top:14px">' +
					'<section class="panel"><h2>Sessions</h2>' +
						renderTable(data.sessions || [], [
							{ key: "id", label: "ID" },
							{ key: "status", label: "Status", render: (r) => badge(r.status) },
							{ key: "expires_at", label: "Expires" },
							{ key: "id", label: "", render: (r) => '<button class="danger" data-session="' + esc(r.id) + '">Revoke</button>' },
						]) +
					'</section>' +
					'<section class="panel"><h2>Refresh Tokens</h2>' +
						renderTable(data.refresh_tokens || [], [
							{ key: "id", label: "ID" },
							{ key: "token_hash", label: "Hash" },
							{ key: "family_id", label: "Family" },
							{ key: "revoked_at", label: "Revoked" },
							{ key: "id", label: "", render: (r) => '<button class="danger" data-refresh="' + esc(r.id) + '">Revoke</button>' },
						]) +
					'</section>' +
					'<section class="panel"><h2>Credentials</h2>' +
						renderTable(data.credentials || [], [
							{ key: "id", label: "ID" },
							{ key: "type", label: "Type" },
							{ key: "secret_hash", label: "Hash" },
							{ key: "enabled", label: "Enabled", render: (r) => badge(Boolean(r.enabled)) },
						]) +
					'</section>' +
					'<section class="panel"><h2>Permissions</h2>' +
						renderTable(data.permissions || [], [
							{ key: "permission_key", label: "Permission" },
							{ key: "service_key", label: "Service" },
							{ key: "effect", label: "Effect" },
						]) +
					'</section>' +
				'</div>';

			$("saveUserBtn").onclick = async () => {
				const body = {
					email: $("duEmail").value,
					phone: $("duPhone").value,
					username: $("duUsername").value,
					display_name: $("duName").value,
					status: $("duStatus").value,
					is_hyperuser: $("duHyper").value === "true",
					settings: {
						skip_otp: $("duSkipOtp").value === "true",
						refresh_token_ttl_days: $("duRefresh").value,
						access_token_ttl_seconds: $("duAccess").value,
						notes: $("duNotes").value,
					},
				};

				const saved = await api("/admin/dashboard/users/" + encodeURIComponent(u.id), {
					method: "PATCH",
					body: JSON.stringify(body),
				});

				renderUserDetail(saved);
				await loadUsersList();
			};

			$("revokeAllBtn").onclick = async () => {
				await api("/admin/dashboard/users/" + encodeURIComponent(u.id) + "/sessions/revoke-all", {
					method: "POST",
					body: "{}",
				});
				await loadUserDetail(u.id);
			};

			$("resetPasswordBtn").onclick = async () => {
				await api("/admin/dashboard/users/" + encodeURIComponent(u.id) + "/password", {
					method: "POST",
					body: JSON.stringify({ password: $("resetPassword").value }),
				});
				$("resetPassword").value = "";
				await loadUserDetail(u.id);
			};

			document.querySelectorAll("[data-session]").forEach((b) => {
				b.onclick = async () => {
					await api("/admin/dashboard/sessions/" + b.dataset.session, { method: "DELETE" });
					await loadUserDetail(u.id);
				};
			});

			document.querySelectorAll("[data-refresh]").forEach((b) => {
				b.onclick = async () => {
					await api("/admin/dashboard/refresh-tokens/" + b.dataset.refresh, { method: "DELETE" });
					await loadUserDetail(u.id);
				};
			});
		}

		async function renderSettings() {
			$("title").textContent = "Settings";
			$("subtitle").textContent = "Runtime defaults and OTP message template";

			const data = await api("/admin/dashboard/settings");

			let fields = "";

			for (const s of data.settings || []) {
				const full = s.key === "otp_message_template" ? "full" : "";

				fields += '<label class="' + full + '">' +
					esc(s.key);

				if (s.key === "otp_message_template") {
					fields += '<textarea data-setting="' + esc(s.key) + '">' + esc(s.value) + '</textarea>';
				} else {
					fields += '<input data-setting="' + esc(s.key) + '" value="' + esc(s.value) + '">';
				}

				fields += '<span class="sub">' + esc(s.description || "") + '</span>' +
					'</label>';
			}

			$("view").innerHTML =
				'<section class="panel">' +
					'<div class="formgrid">' +
						fields +
						'<div class="full"><button id="saveSettingsBtn" class="primary">Save Settings</button></div>' +
					'</div>' +
				'</section>';

			$("saveSettingsBtn").onclick = async () => {
				const settings = {};
				document.querySelectorAll("[data-setting]").forEach((input) => {
					settings[input.dataset.setting] = input.value;
				});

				await api("/admin/dashboard/settings", {
					method: "PUT",
					body: JSON.stringify({ settings }),
				});

				await renderSettings();
			};
		}

		async function renderOtp() {
			$("title").textContent = "OTP Monitor";
			$("subtitle").textContent = "No plaintext OTP is exposed";

			const data = await api("/admin/dashboard/otp?limit=200");

			$("view").innerHTML =
				'<section class="panel">' +
					renderTable(data.challenges || [], [
						{ key: "id", label: "ID" },
						{ key: "phone", label: "Phone" },
						{ key: "user_id", label: "User" },
						{ key: "purpose", label: "Purpose" },
						{ key: "attempt_count", label: "Attempts", render: (r) => esc(r.attempt_count) + "/" + esc(r.max_attempts) },
						{ key: "delivery_status", label: "Delivery", render: (r) => badge(r.delivery_status) },
						{ key: "delivery_attempts", label: "Send tries" },
						{ key: "sent_at", label: "Sent" },
						{ key: "delivery_error", label: "Delivery error" },
						{ key: "expires_at", label: "Expires" },
						{ key: "used_at", label: "Used" },
						{ key: "id", label: "", render: (r) => '<button class="warn" data-otp="' + esc(r.id) + '">Expire</button>' },
					]) +
				'</section>';

			document.querySelectorAll("[data-otp]").forEach((b) => {
				b.onclick = async () => {
					await api("/admin/dashboard/otp/" + b.dataset.otp + "/expire", {
						method: "POST",
						body: "{}",
					});
					await renderOtp();
				};
			});
		}

		async function renderAudit() {
			$("title").textContent = "Audit";
			$("subtitle").textContent = "Security events";

			const data = await api("/admin/dashboard/audit?limit=250");

			$("view").innerHTML =
				'<section class="panel">' +
					renderTable(data.audit || [], [
						{ key: "event_type", label: "Event" },
						{ key: "severity", label: "Severity" },
						{ key: "user_id", label: "User" },
						{ key: "target_id", label: "Target" },
						{ key: "outcome", label: "Outcome", render: (r) => badge(r.outcome) },
						{ key: "created_at", label: "Time" },
					]) +
				'</section>';
		}

		async function renderKv() {
			$("title").textContent = "KV";
			$("subtitle").textContent = "Cache keys and safe previews";

			$("view").innerHTML =
				'<section class="panel">' +
					'<div class="toolbar">' +
						'<label>Prefix<input id="kvPrefix" placeholder="perm:, user_status:, sess:"></label>' +
						'<label>Include values<select id="kvValues"><option value="false">false</option><option value="true">true</option></select></label>' +
						'<button id="kvLoadBtn">Load KV</button>' +
					'</div>' +
					'<div id="kvList"></div>' +
				'</section>';

			$("kvLoadBtn").onclick = async () => {
				const data = await api(
					"/admin/dashboard/kv?prefix=" +
					encodeURIComponent($("kvPrefix").value) +
					"&include_values=" +
					$("kvValues").value
				);

				$("kvList").innerHTML =
					'<div class="output">' + esc(JSON.stringify(data.kv, null, 2)) + '</div>';
			};

			$("kvLoadBtn").click();
		}

		async function renderInfra() {
			$("title").textContent = "Infra";
			$("subtitle").textContent = "Bindings, R2 backups, GoWA, Durable Object probe";

			const data = await api("/admin/dashboard/infra");
			const infraJson = esc(JSON.stringify(data.infra, null, 2));

			$("view").innerHTML =
				'<div class="grid two">' +
					'<section class="panel">' +
						'<h2>Infra Summary</h2>' +
						'<div class="output">' + infraJson + '</div>' +
					'</section>' +
					'<section class="panel">' +
						'<h2>Rate Limit Durable Object</h2>' +
						'<div class="stack">' +
							'<label>Key<input id="doKey" placeholder="ratelimit:login:identifier:vauthaitrh"></label>' +
							'<div class="actionRow">' +
								'<button id="doBtn">Probe State</button>' +
								'<button id="doResetBtn" class="warn">Reset Key</button>' +
							'</div>' +
							'<div class="sub">' +
						'Contoh login: ratelimit:login:identifier:aththaa<br>' +
								'Contoh OTP: ratelimit:otp:phone:6285795717974' +
							'</div>' +
							'<div id="doOut" class="output"></div>' +
						'</div>' +
					'</section>' +
				'</div>';

			$("doBtn").onclick = async () => {
				const key = $("doKey").value.trim();

				if (!key) {
					$("doOut").textContent = "Key kosong.";
					return;
				}

				const res = await api("/admin/dashboard/durable/rate-limit-state", {
					method: "POST",
					body: JSON.stringify({ key }),
				});

				$("doOut").textContent = JSON.stringify(res, null, 2);
			};

			$("doResetBtn").onclick = async () => {
				const key = $("doKey").value.trim();

				if (!key) {
					$("doOut").textContent = "Key kosong.";
					return;
				}

				if (!confirm("Reset rate limit untuk key ini?")) return;

				const res = await api("/admin/dashboard/durable/rate-limit-reset", {
					method: "POST",
					body: JSON.stringify({ key }),
				});

				$("doOut").textContent = JSON.stringify(res, null, 2);
			};
		}

		async function load() {
			renderNav();

			try {
				if (state.view === "overview") {
					const data = await api("/admin/dashboard/summary");
					renderOverview(data.dashboard);
				}

				if (state.view === "users") await renderUsers();
				if (state.view === "settings") await renderSettings();
				if (state.view === "otp") await renderOtp();
				if (state.view === "audit") await renderAudit();
				if (state.view === "kv") await renderKv();
				if (state.view === "infra") await renderInfra();
			} catch (error) {
				$("view").innerHTML = '<div class="notice">' + esc(error.message) + '</div>';
				setStatus("error");
			}
		}

		$("loginBtn").onclick = async () => {
			try {
				if (!state.challengeId) {
					const data = await fetch("/auth/login/password", {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							identifier: $("identifier").value,
							password: $("password").value,
						}),
					}).then((r) => r.json());

					if (!data.ok) throw new Error(data.message || data.code);

					if (data.access_token && data.refresh_token) {
						state.accessToken = data.access_token;
						state.refreshToken = data.refresh_token;

						sessionStorage.setItem("irwanmotor.auth.access", state.accessToken);
						sessionStorage.setItem("irwanmotor.auth.refresh", state.refreshToken);

						state.challengeId = "";
						$("otp").value = "";
						$("otpWrap").classList.add("hidden");

						await bootstrap();
						return;
					}

					if (!data.otp_required || !data.challenge_id) throw new Error("Server tidak memberikan challenge OTP");
					state.challengeId = data.challenge_id;
					$("otpWrap").classList.remove("hidden");
					$("loginNotice").textContent = "Challenge OTP dibuat untuk " + (data.phone || "nomor terdaftar") + ".";
					$("loginNotice").classList.remove("hidden");
					renderOtpDelivery(data);
					startOtpPolling();
					return;
				}

				const data = await fetch("/auth/login/verify", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						challenge_id: state.challengeId,
						otp: $("otp").value,
					}),
				}).then((r) => r.json());

				if (!data.ok) throw new Error(data.message || data.code);

				state.accessToken = data.access_token;
				state.refreshToken = data.refresh_token;

				sessionStorage.setItem("irwanmotor.auth.access", state.accessToken);
				sessionStorage.setItem("irwanmotor.auth.refresh", state.refreshToken);

				state.challengeId = "";
				stopOtpPolling();

				await bootstrap();
			} catch (error) {
				$("loginNotice").textContent = error.message;
				$("loginNotice").classList.remove("hidden");
			}
		};

		$("resendOtpBtn").onclick = async () => {
			if (!state.challengeId) return;
			const button = $("resendOtpBtn");
			button.disabled = true;
			button.textContent = "Mengirim ulang...";
			try {
				const res = await fetch("/auth/otp/resend", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ challenge_id: state.challengeId }),
				});
				const data = await res.json();
				if (!res.ok || !data.ok) {
					if (data.retry_after_seconds) renderOtpDelivery({ delivery_status: "retrying", retry_after_seconds: data.retry_after_seconds, can_resend: false });
					throw new Error(data.message || data.code || "Gagal mengirim ulang OTP");
				}
				state.challengeId = data.challenge_id;
				$("otp").value = "";
				renderOtpDelivery(data);
				startOtpPolling();
			} catch (error) {
				$("loginNotice").textContent = error.message;
				$("loginNotice").classList.remove("hidden");
			} finally {
				pollOtpStatus();
			}
		};

		["identifier", "password", "otp"].forEach((id) => {
			const el = $(id);
			if (!el) return;

			el.addEventListener("keydown", (event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					$("loginBtn").click();
				}
			});
		});

		$("logoutBtn").onclick = () => {
			stopOtpPolling();
			sessionStorage.removeItem("irwanmotor.auth.access");
			sessionStorage.removeItem("irwanmotor.auth.refresh");

			state.accessToken = "";
			state.refreshToken = "";
			state.challengeId = "";
			state.actor = null;

			showLogin();
		};

		$("refreshBtn").onclick = load;

		bootstrap();
	</script>
</body>
</html>`, {
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store",
		},
	});
}
