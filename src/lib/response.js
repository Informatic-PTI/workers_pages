export function requestId() {
	const bytes = new Uint8Array(12);
	crypto.getRandomValues(bytes);
	return `req_${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

export function json(data, init = {}) {
	const headers = new Headers(init.headers || {});
	headers.set("content-type", "application/json; charset=utf-8");
	headers.set("cache-control", "no-store");
	return new Response(JSON.stringify(data, null, 2), { ...init, headers });
}

export function ok(data = {}, request_id, status = 200) {
	return json({ ok: true, request_id, ...data }, { status });
}

export function fail(code, message, request_id, status = 400, extra = {}) {
	return json({ ok: false, code, message, request_id, ...extra }, { status });
}

export function notFound(request_id) {
	return fail("not_found", "Not found", request_id, 404);
}

export async function readJson(request, request_id) {
	try {
		return await request.json();
	} catch {
		throw httpError("validation_error", "Invalid JSON body", 400, request_id);
	}
}

export function httpError(code, message, status = 400, request_id = undefined, extra = {}) {
	const error = new Error(message);
	error.code = code;
	error.status = status;
	error.request_id = request_id;
	error.extra = extra;
	return error;
}

export function errorResponse(error, request_id) {
	if (error?.code && error?.status) {
		return fail(error.code, error.message, error.request_id || request_id, error.status, error.extra || {});
	}
	return fail("internal_error", "Internal error", request_id, 500);
}

export function applyCors(response, request, env) {
	const origin = request.headers.get("origin");
	const allowed = (env.CORS_ORIGINS || "").split(",").map((v) => v.trim()).filter(Boolean);
	const headers = new Headers(response.headers);
	if (origin && (allowed.includes("*") || allowed.includes(origin))) {
		headers.set("access-control-allow-origin", origin);
		headers.set("vary", "Origin");
	} else if (!origin && allowed.includes("*")) {
		headers.set("access-control-allow-origin", "*");
	}
	headers.set("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
	headers.set("access-control-allow-headers", "Authorization,Content-Type,X-Request-Id");
	headers.set("access-control-max-age", "86400");
	return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export function optionsResponse(request, env) {
	return applyCors(new Response(null, { status: 204 }), request, env);
}
