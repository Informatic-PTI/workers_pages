import { loadProfile, passwordLogin, verifyLoginOtp } from "../services/auth.js";
import { isAuthenticated } from "../state/session.js";
import { escapeHtml, formDataObject, toast } from "../components/ui.js";
import { navigate } from "../router.js";

let pendingChallenge = null;
let rememberChoice = true;

export const loginPage = {
	public: true,
	active: "login",
	render() {
		return `<main class="login-page">
			<section class="login-panel" aria-labelledby="login-title">
				<div class="brand login-brand"><div class="brand-mark">IM</div><div><strong>Irwan Motor</strong><small>Workshop Management</small></div></div>
				<h1 id="login-title">Login ke Sistem</h1><p>Masukkan kredensial akun operasional Anda.</p>
				<div id="login-alert"></div>
				<form class="login-form" id="login-form">
					<div class="field"><label for="identifier">Email atau Username</label><input class="input" id="identifier" name="identifier" autocomplete="username" placeholder="" required></div>
					<div class="field"><label for="password">Kata Sandi</label><input class="input" id="password" name="password" type="password" autocomplete="current-password" minlength="8" required></div>
					<div class="login-options"><label class="checkbox"><input name="remember" type="checkbox" checked> Ingat Saya</label><span>Session aman dengan refresh token</span></div>
					<button class="btn" id="login-submit" type="submit">Masuk</button>
				</form>
				<form class="login-form" id="otp-form" hidden>
					<div class="alert"><div><strong>Verifikasi OTP</strong><p id="otp-message">Masukkan kode yang dikirim ke WhatsApp Anda.</p></div></div>
					<div class="field"><label for="otp">Kode OTP</label><input class="input" id="otp" name="otp" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>
					<button class="btn" id="otp-submit" type="submit">Verifikasi dan Masuk</button>
					<button class="btn btn-ghost" id="back-login" type="button">Kembali</button>
				</form>
			</section>
			<aside class="login-hero" aria-label="Informasi sistem"><div class="login-hero-content"><span class="status status-info">Operasional Terintegrasi</span><h2>Kendalikan bengkel dalam satu alur kerja.</h2><p>Booking, service, inventori, pembayaran, dan laporan selalu sinkron untuk setiap peran.</p><div class="hero-stats"><div class="hero-stat"><strong>Real-time</strong><small>Status service</small></div><div class="hero-stat"><strong>Aman</strong><small>Role & session</small></div><div class="hero-stat"><strong>Terukur</strong><small>Stok & pendapatan</small></div></div></div></aside>
		</main>`;
	},
	mount() {
		if (isAuthenticated()) { navigate("/dashboard", { replace: true }); return; }
		const loginForm = document.querySelector("#login-form");
		const otpForm = document.querySelector("#otp-form");
		const alert = document.querySelector("#login-alert");
		loginForm?.addEventListener("submit", async (event) => {
			event.preventDefault();
			const values = formDataObject(loginForm);
			rememberChoice = values.remember === "on";
			const button = document.querySelector("#login-submit");
			button.disabled = true; button.textContent = "Memeriksa…"; alert.innerHTML = "";
			try {
				const result = await passwordLogin(values.identifier, values.password, rememberChoice);
				if (result.otp_required) {
					pendingChallenge = result.challenge_id;
					document.querySelector("#otp-message").textContent = `Kode dikirim ke ${result.phone || "nomor terdaftar"} dan berlaku ${Math.ceil((result.expires_in || 300) / 60)} menit.`;
					loginForm.hidden = true; otpForm.hidden = false; document.querySelector("#otp")?.focus();
				} else {
					await loadProfile(); toast("Login berhasil", "success"); navigate("/dashboard", { replace: true });
				}
			} catch (error) {
				alert.innerHTML = `<div class="alert alert-danger" style="margin-bottom:16px">${escapeHtml(error.message)}</div>`;
			} finally { button.disabled = false; button.textContent = "Masuk"; }
		});
		otpForm?.addEventListener("submit", async (event) => {
			event.preventDefault();
			const button = document.querySelector("#otp-submit");
			button.disabled = true; button.textContent = "Memverifikasi…";
			try {
				await verifyLoginOtp(pendingChallenge, formDataObject(otpForm).otp, rememberChoice);
				await loadProfile(); toast("Verifikasi berhasil", "success"); navigate("/dashboard", { replace: true });
			} catch (error) { toast(error.message, "error"); }
			finally { button.disabled = false; button.textContent = "Verifikasi dan Masuk"; }
		});
		document.querySelector("#back-login")?.addEventListener("click", () => { otpForm.hidden = true; loginForm.hidden = false; pendingChallenge = null; });
	},
};
