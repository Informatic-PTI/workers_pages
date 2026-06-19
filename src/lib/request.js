import { sha256Hex } from "./crypto.js";

export async function requestMeta(request) {
	const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
	const ua = request.headers.get("user-agent") || "unknown";
	return {
		ip,
		user_agent: ua,
		ip_hash: await sha256Hex(ip),
		user_agent_hash: await sha256Hex(ua),
	};
}

export function pathParts(url) {
	return new URL(url).pathname.split("/").filter(Boolean);
}

export function isAdminRequest(request, env) {
	const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || request.headers.get("x-admin-token");
	return Boolean(env.ADMIN_API_TOKEN && token && token === env.ADMIN_API_TOKEN);
}
