import {
	getOtpStatus,
	loadProfile,
	passwordLogin,
	resendOtp,
	startRegistration,
	verifyLoginOtp,
	verifyRegistrationOtp,
} from "../services/auth.js";
import { isAuthenticated } from "../state/session.js";
import { escapeHtml, formDataObject, toast } from "../components/ui.js";
import { navigate } from "../router.js";

let pendingChallenge = null;
let pendingPurpose = null;
let rememberChoice = true;
let otpPollTimer = null;

const authCopy = {
	login: {
		title: "Login ke Sistem",
		description: "Masukkan kredensial akun operasional Anda.",
	},
	register: {
		title: "Daftar Akun",
		description: "Buat akun baru dan verifikasi nomor WhatsApp Anda.",
	},
};

function stopOtpPolling() {
	if (otpPollTimer) clearInterval(otpPollTimer);
	otpPollTimer = null;
}

function setAuthHeading(view) {
	const copy = authCopy[view];
	const title = document.querySelector("#auth-title");
	const description = document.querySelector("#auth-description");
	if (title) title.textContent = copy.title;
	if (description) description.textContent = copy.description;
}

function showAuthError(error) {
	const alert = document.querySelector("#auth-alert");
	if (alert) alert.innerHTML = `<div class="alert alert-danger auth-alert">${escapeHtml(error?.message || "Permintaan tidak dapat diproses")}</div>`;
}

function clearAuthError() {
	const alert = document.querySelector("#auth-alert");
	if (alert) alert.innerHTML = "";
}

function switchAuthView(view) {
	stopOtpPolling();
	pendingChallenge = null;
	pendingPurpose = null;
	clearAuthError();
	setAuthHeading(view);
	const tabs = document.querySelector("#auth-tabs");
	const loginForm = document.querySelector("#login-form");
	const registerForm = document.querySelector("#register-form");
	const otpForm = document.querySelector("#otp-form");
	if (tabs) tabs.hidden = false;
	if (loginForm) loginForm.hidden = view !== "login";
	if (registerForm) registerForm.hidden = view !== "register";
	if (otpForm) otpForm.hidden = true;
	document.querySelectorAll("[data-auth-view]").forEach((button) => {
		const selected = button.dataset.authView === view;
		button.setAttribute("aria-selected", String(selected));
		button.tabIndex = selected ? 0 : -1;
	});
	document.querySelector(view === "login" ? "#identifier" : "#display-name")?.focus();
}

function showOtpDelivery(data) {
	const status = data.delivery_status || "pending";
	const messages = {
		pending: "Menyiapkan OTP...",
		queued: "OTP sudah masuk antrean pengiriman WhatsApp.",
		sending: "OTP sedang dikirim ke WhatsApp.",
		retrying: "Pengiriman belum berhasil dan sedang dicoba ulang.",
		sent: "OTP berhasil dikirim ke WhatsApp.",
		failed: "OTP gagal dikirim. Silakan kirim ulang setelah jeda berakhir.",
	};
	const target = document.querySelector("#otp-delivery-status");
	if (target) target.textContent = messages[status] || messages.pending;
	const resend = document.querySelector("#resend-otp");
	if (resend) {
		const wait = Math.max(0, Number(data.retry_after_seconds || 0));
		resend.disabled = !data.can_resend && wait > 0;
		resend.textContent = wait > 0 ? `Kirim ulang (${wait} dtk)` : "Kirim ulang OTP";
	}
}

async function refreshOtpStatus() {
	if (!pendingChallenge) return;
	try {
		const status = await getOtpStatus(pendingChallenge);
		showOtpDelivery(status);
		if (status.expired) stopOtpPolling();
	} catch {
		// A transient status request must not block manual OTP verification.
	}
}

function startOtpPolling() {
	stopOtpPolling();
	void refreshOtpStatus();
	otpPollTimer = setInterval(refreshOtpStatus, 2000);
}

function openOtpStep(result, purpose) {
	if (!result.challenge_id) throw new Error("Server tidak memberikan challenge OTP");
	pendingChallenge = result.challenge_id;
	pendingPurpose = purpose;
	const isRegistration = purpose === "register";
	const title = document.querySelector("#auth-title");
	const description = document.querySelector("#auth-description");
	const message = document.querySelector("#otp-message");
	const submit = document.querySelector("#otp-submit");
	if (title) title.textContent = isRegistration ? "Verifikasi Pendaftaran" : "Verifikasi Login";
	if (description) description.textContent = "Masukkan kode OTP enam digit untuk melanjutkan.";
	if (message) {
		message.textContent = `OTP ${isRegistration ? "pendaftaran" : "login"} untuk ${result.phone || "nomor terdaftar"} berlaku ${Math.ceil((result.expires_in || 300) / 60)} menit.`;
	}
	if (submit) submit.textContent = isRegistration ? "Verifikasi dan Daftar" : "Verifikasi dan Masuk";
	const tabs = document.querySelector("#auth-tabs");
	if (tabs) tabs.hidden = true;
	document.querySelector("#login-form").hidden = true;
	document.querySelector("#register-form").hidden = true;
	document.querySelector("#otp-form").hidden = false;
	showOtpDelivery(result);
	document.querySelector("#otp")?.focus();
	startOtpPolling();
}

export const loginPage = {
	public: true,
	active: "login",
	render() {
		return `<main class="login-page">
			<section class="login-panel" aria-labelledby="auth-title">
				<div class="brand login-brand"><div class="brand-mark">IM</div><div><strong>Irwan Motor</strong><small>Workshop Management</small></div></div>
				<div class="auth-tabs" id="auth-tabs" role="tablist" aria-label="Pilih autentikasi">
					<button class="auth-tab" id="login-tab" type="button" role="tab" aria-controls="login-form" aria-selected="true" data-auth-view="login">Masuk</button>
					<button class="auth-tab" id="register-tab" type="button" role="tab" aria-controls="register-form" aria-selected="false" data-auth-view="register" tabindex="-1">Daftar</button>
				</div>
				<h1 id="auth-title">Login ke Sistem</h1><p id="auth-description">Masukkan kredensial akun operasional Anda.</p>
				<div id="auth-alert" role="alert" aria-live="assertive"></div>
				<form class="login-form" id="login-form" role="tabpanel" aria-labelledby="login-tab">
					<div class="field"><label for="identifier">Email atau Username</label><input class="input" id="identifier" name="identifier" autocomplete="username" required></div>
					<div class="field"><label for="password">Kata Sandi</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" minlength="8" required></div>
					<div class="login-options"><label class="checkbox"><input name="remember" type="checkbox" checked> Ingat Saya</label><span>Session aman dengan refresh token</span></div>
					<button class="btn" id="login-submit" type="submit">Masuk</button>
				</form>
				<form class="login-form" id="register-form" role="tabpanel" aria-labelledby="register-tab" hidden>
					<div class="field"><label for="display-name">Nama Lengkap</label><input class="input" id="display-name" name="display_name" autocomplete="name" required></div>
					<div class="field"><label for="register-username">Username</label><input class="input" id="register-username" name="username" autocomplete="username" minlength="3" required></div>
					<div class="field"><label for="register-email">Email</label><input class="input" id="register-email" name="email" type="email" autocomplete="email" required></div>
					<div class="field"><label for="register-phone">Nomor WhatsApp</label><input class="input" id="register-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Contoh: 6281234567890" required><small class="field-hint">Gunakan format kode negara tanpa tanda +.</small></div>
					<div class="field"><label for="register-password">Kata Sandi</label><input class="input" id="register-password" name="password" type="password" autocomplete="new-password" minlength="8" required></div>
					<div class="field"><label for="password-confirmation">Ulangi Kata Sandi</label><input class="input" id="password-confirmation" name="password_confirmation" type="password" autocomplete="new-password" minlength="8" required></div>
					<div class="login-options"><label class="checkbox"><input name="remember" type="checkbox" checked> Tetap masuk</label><span>Verifikasi OTP wajib</span></div>
					<button class="btn" id="register-submit" type="submit">Daftar dan Kirim OTP</button>
				</form>
				<form class="login-form" id="otp-form" hidden>
					<div class="alert"><div><strong>Verifikasi OTP</strong><p id="otp-message">Masukkan kode yang dikirim ke WhatsApp Anda.</p></div></div>
					<div class="alert" id="otp-delivery-status" role="status">Menyiapkan OTP...</div>
					<div class="field"><label for="otp">Kode OTP</label><input class="input" id="otp" name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>
					<button class="btn" id="otp-submit" type="submit">Verifikasi</button>
					<button class="btn btn-ghost" id="resend-otp" type="button">Kirim ulang OTP</button>
					<button class="btn btn-ghost" id="back-auth" type="button">Kembali</button>
				</form>
			</section>
			<aside class="login-hero" aria-label="Informasi sistem"><div class="login-hero-content"><span class="status status-info">Operasional Terintegrasi</span><h2>Kendalikan bengkel dalam satu alur kerja.</h2><p>Booking, service, inventori, pembayaran, dan laporan selalu sinkron untuk setiap peran.</p><div class="hero-stats"><div class="hero-stat"><strong>Real-time</strong><small>Status service</small></div><div class="hero-stat"><strong>Aman</strong><small>Role & session</small></div><div class="hero-stat"><strong>Terukur</strong><small>Stok & pendapatan</small></div></div></div></aside>
		</main>`;
	},
	mount() {
		if (isAuthenticated()) { navigate("/dashboard", { replace: true }); return; }
		stopOtpPolling();
		pendingChallenge = null;
		pendingPurpose = null;
		const loginForm = document.querySelector("#login-form");
		const registerForm = document.querySelector("#register-form");
		const otpForm = document.querySelector("#otp-form");

		document.querySelectorAll("[data-auth-view]").forEach((button) => {
			button.addEventListener("click", () => switchAuthView(button.dataset.authView));
		});

		loginForm?.addEventListener("submit", async (event) => {
			event.preventDefault();
			const values = formDataObject(loginForm);
			rememberChoice = values.remember === "on";
			const button = document.querySelector("#login-submit");
			button.disabled = true;
			button.textContent = "Memeriksa...";
			clearAuthError();
			try {
				const result = await passwordLogin(values.identifier, values.password, rememberChoice);
				if (result.otp_required) openOtpStep(result, "login");
				else {
					stopOtpPolling();
					await loadProfile();
					toast("Login berhasil", "success");
					navigate("/dashboard", { replace: true });
				}
			} catch (error) {
				showAuthError(error);
			} finally {
				button.disabled = false;
				button.textContent = "Masuk";
			}
		});

		registerForm?.addEventListener("submit", async (event) => {
			event.preventDefault();
			const values = formDataObject(registerForm);
			const confirmation = document.querySelector("#password-confirmation");
			confirmation.setCustomValidity(values.password === values.password_confirmation ? "" : "Kata sandi tidak sama");
			if (!registerForm.reportValidity()) return;
			rememberChoice = values.remember === "on";
			const button = document.querySelector("#register-submit");
			button.disabled = true;
			button.textContent = "Mendaftarkan...";
			clearAuthError();
			try {
				const result = await startRegistration(values);
				openOtpStep(result, "register");
			} catch (error) {
				showAuthError(error);
			} finally {
				button.disabled = false;
				button.textContent = "Daftar dan Kirim OTP";
			}
		});

		document.querySelector("#password-confirmation")?.addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));

		otpForm?.addEventListener("submit", async (event) => {
			event.preventDefault();
			if (!pendingChallenge || !pendingPurpose) return;
			const button = document.querySelector("#otp-submit");
			button.disabled = true;
			button.textContent = "Memverifikasi...";
			clearAuthError();
			try {
				const otp = formDataObject(otpForm).otp;
				if (pendingPurpose === "register") await verifyRegistrationOtp(pendingChallenge, otp, rememberChoice);
				else await verifyLoginOtp(pendingChallenge, otp, rememberChoice);
				const successMessage = pendingPurpose === "register" ? "Pendaftaran berhasil" : "Verifikasi berhasil";
				stopOtpPolling();
				await loadProfile();
				toast(successMessage, "success");
				navigate("/dashboard", { replace: true });
			} catch (error) {
				showAuthError(error);
			} finally {
				button.disabled = false;
				button.textContent = pendingPurpose === "register" ? "Verifikasi dan Daftar" : "Verifikasi dan Masuk";
			}
		});

		document.querySelector("#resend-otp")?.addEventListener("click", async () => {
			const button = document.querySelector("#resend-otp");
			if (!pendingChallenge || !button) return;
			button.disabled = true;
			button.textContent = "Mengirim ulang...";
			clearAuthError();
			try {
				const result = await resendOtp(pendingChallenge);
				pendingChallenge = result.challenge_id;
				const otp = document.querySelector("#otp");
				if (otp) otp.value = "";
				showOtpDelivery(result);
				startOtpPolling();
			} catch (error) {
				showAuthError(error);
				if (error.details?.retry_after_seconds) {
					showOtpDelivery({ delivery_status: "retrying", retry_after_seconds: error.details.retry_after_seconds, can_resend: false });
				}
			} finally {
				void refreshOtpStatus();
			}
		});

		document.querySelector("#back-auth")?.addEventListener("click", () => {
			switchAuthView(pendingPurpose === "register" ? "register" : "login");
		});
	},
};
