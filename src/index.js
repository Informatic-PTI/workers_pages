import { handleAdmin } from "./routes/admin.js";
import { handleAuth } from "./routes/auth.js";
import { handleDashboard } from "./routes/dashboard.js";
import { handleHealth } from "./routes/health.js";
import { RateLimitDO } from "./durable/RateLimitDO.js";
import { SessionGuardDO } from "./durable/SessionGuardDO.js";
import { cleanupExpiredOtp } from "./db/otpChallenges.js";
import { cleanupExpiredRefreshTokens } from "./db/refreshTokens.js";
import { expireOldSessions } from "./db/sessions.js";
import { handleQueue } from "./queues/index.js";
import { applyCors, errorResponse, notFound, optionsResponse, requestId } from "./lib/response.js";

export { RateLimitDO, SessionGuardDO };

async function route(request, env, ctx, request_id) {
	const url = new URL(request.url);
	const parts = url.pathname.split("/").filter(Boolean);
	if (parts.length === 0 || (request.method === "GET" && parts[0] === "health")) return handleHealth(env, request_id);
	if (request.method === "GET" && parts[0] === "dashboard") return handleDashboard();
	if (parts[0] === "auth") return handleAuth(request, env, ctx, request_id, parts);
	if (parts[0] === "admin") return handleAdmin(request, env, ctx, request_id, parts);
	return notFound(request_id);
}

export default {
	async fetch(request, env, ctx) {
		if (request.method === "OPTIONS") return optionsResponse(request, env);
		const request_id = request.headers.get("x-request-id") || requestId();
		try {
			return applyCors(await route(request, env, ctx, request_id), request, env);
		} catch (error) {
			return applyCors(errorResponse(error, request_id), request, env);
		}
	},

	async queue(batch, env, ctx) {
		return handleQueue(batch, env, ctx);
	},

	async scheduled(event, env, ctx) {
		ctx.waitUntil(Promise.all([
			cleanupExpiredOtp(env),
			expireOldSessions(env),
			cleanupExpiredRefreshTokens(env),
			env.BACKUP_QUEUE ? env.BACKUP_QUEUE.send({ type: "backup_snapshot", request_id: `cron_${event.scheduledTime}` }) : Promise.resolve(),
		]));
	},
};
