import { authApi } from "../api/client.js";
import { clearSession, saveProfile, saveTokens } from "../state/session.js";

export async function passwordLogin(identifier, password, remember = true) {
	const data = await authApi.post("/login/password", { identifier, password });
	if (data.access_token) saveTokens(data, remember);
	return data;
}

export async function verifyLoginOtp(challengeId, otp, remember = true) {
	const data = await authApi.post("/login/verify", { challenge_id: challengeId, otp });
	if (data.access_token) saveTokens(data, remember);
	return data;
}

export async function loadProfile() {
	const profile = await authApi.get("/me");
	saveProfile(profile);
	return profile;
}

export async function logout() {
	try { await authApi.post("/logout", {}); } catch { /* Local logout remains safe when session already expired. */ }
	clearSession();
}
