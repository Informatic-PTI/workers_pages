import { requireAppAuth } from "../middlewares/appAuth.js";
import { ok, readJson } from "../lib/response.js";
import {
	communicationProviderStatus,
	sendOperationalEmail,
	sendOperationalWhatsApp,
	whatsappHealth,
} from "../services/providersService.js";

async function requireProviderAccess(request, env, requestId) {
	return requireAppAuth(request, env, requestId, {
		roles: ["admin", "cashier", "mechanic"],
		permission: "workshop:read",
	});
}

export async function communicationProvidersController(request, env, _ctx, requestId) {
	await requireProviderAccess(request, env, requestId);
	return ok({ providers: await communicationProviderStatus(env) }, requestId);
}

export async function whatsappHealthController(request, env, _ctx, requestId) {
	await requireProviderAccess(request, env, requestId);
	return ok({ whatsapp: await whatsappHealth(env) }, requestId);
}

export async function sendWhatsAppController(request, env, _ctx, requestId) {
	await requireProviderAccess(request, env, requestId);
	return ok(await sendOperationalWhatsApp(env, await readJson(request, requestId), requestId), requestId, 202);
}

export async function sendEmailController(request, env, _ctx, requestId) {
	await requireProviderAccess(request, env, requestId);
	return ok(await sendOperationalEmail(env, await readJson(request, requestId), requestId), requestId, 202);
}
