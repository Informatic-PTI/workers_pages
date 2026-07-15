import { checkGowaHealth, sendWhatsAppMessage } from "../lib/gowa.js";
import { httpError } from "../lib/response.js";
import { requiredText } from "../lib/validation.js";

export async function communicationProviderStatus(env) {
	const whatsappConfigured = Boolean(env.GOWA_VPC?.fetch || (env.GOWA_API_BASE && env.GOWA_API_TOKEN));
	return {
		whatsapp: {
			configured: whatsappConfigured,
			mode: env.GOWA_VPC?.fetch ? "service_binding" : env.GOWA_API_BASE ? "http_api" : "not_configured",
		},
		email: {
			configured: false,
			mode: "not_configured",
		},
	};
}

export async function whatsappHealth(env) {
	const providers = await communicationProviderStatus(env);
	if (!providers.whatsapp.configured) return { configured: false, reachable: false };
	const result = await checkGowaHealth(env);
	return { configured: true, reachable: result.gowa_reachable };
}

export async function sendOperationalWhatsApp(env, body, requestId) {
	const providers = await communicationProviderStatus(env);
	if (!providers.whatsapp.configured) {
		throw httpError("provider_not_configured", "Provider WhatsApp belum dikonfigurasi", 503, requestId, { provider: "whatsapp" });
	}
	const to = requiredText(body.to, "to", requestId, 30).replace(/[^\d+]/g, "");
	if (!/^\+?\d{8,15}$/.test(to)) {
		throw httpError("validation_error", "Nomor WhatsApp tidak valid", 400, requestId, { field: "to" });
	}
	const message = requiredText(body.message, "message", requestId, 1200);
	try {
		await sendWhatsAppMessage(env, { to, message, requestId });
		return { provider: "whatsapp", accepted: true };
	} catch (error) {
		throw httpError("provider_unavailable", "Pesan WhatsApp belum dapat dikirim", 502, requestId, { provider: "whatsapp" });
	}
}

export function sendOperationalEmail(_env, _body, requestId) {
	throw httpError("provider_not_configured", "Provider email belum dikonfigurasi", 503, requestId, { provider: "email" });
}
