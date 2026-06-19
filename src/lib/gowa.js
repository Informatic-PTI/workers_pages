import { getNumberSetting, getSetting } from "../db/settings.js";

async function gowaFetch(env, url, init) {
	if (env.GOWA_VPC?.fetch) return env.GOWA_VPC.fetch(url, init);
	return fetch(url, init);
}

export async function sendWhatsAppMessage(env, { to, message, requestId }) {
	const base = env.GOWA_API_BASE || "http://gowa.local";
	const headers = { "content-type": "application/json", "x-request-id": requestId };
	if (env.GOWA_API_TOKEN) headers.authorization = `Bearer ${env.GOWA_API_TOKEN}`;
	const res = await gowaFetch(env, `${base.replace(/\/$/, "")}/send/message`, {
		method: "POST",
		headers,
		body: JSON.stringify({ phone: to, message }),
	});
	if (!res.ok) {
		const error = new Error(`gowa_send_failed_${res.status}`);
		error.status = res.status;
		throw error;
	}
	return { ok: true };
}

export async function sendWhatsAppOtp(env, { phone, otp, purpose, requestId }) {
	const ttlMinutes = Math.max(1, Math.floor(await getNumberSetting(env, "otp_ttl_seconds") / 60));
	const template = await getSetting(env, "otp_message_template");
	const message = template
		.replaceAll("{{otp}}", otp)
		.replaceAll("{{ttl_minutes}}", String(ttlMinutes))
		.replaceAll("{{purpose}}", String(purpose || "auth"));
	return sendWhatsAppMessage(env, { to: phone, message, requestId, purpose });
}

export async function checkGowaHealth(env) {
	const base = (env.GOWA_API_BASE || "http://gowa.local").replace(/\/$/, "");
	for (const path of ["/health", ""]) {
		try {
			const res = await gowaFetch(env, `${base}${path}`, { method: "GET" });
			if (res.ok) return { ok: true, gowa_reachable: true, base_url: base };
		} catch {
			// Try the fallback path.
		}
	}
	return { ok: false, gowa_reachable: false, code: "gowa_unreachable", base_url: base };
}
