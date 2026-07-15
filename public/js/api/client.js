import { apiPath, authPath, config } from "../config.js";
import { accessToken, clearSession, refreshToken, saveTokens } from "../state/session.js";

export class ApiError extends Error {
	constructor(message, { status = 0, code = "request_failed", requestId = null, details = {} } = {}) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.code = code;
		this.requestId = requestId;
		this.details = details;
	}
}

let refreshPromise = null;

async function parseResponse(response) {
	const type = response.headers.get("content-type") || "";
	if (type.includes("application/json")) return response.json();
	return { ok: response.ok, message: response.ok ? "" : "Respons server tidak valid" };
}

async function refreshAccessToken() {
	if (!refreshToken()) return false;
	if (!refreshPromise) {
		refreshPromise = fetch(authPath("/refresh"), {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ refresh_token: refreshToken() }),
		}).then(async (response) => {
			const data = await parseResponse(response);
			if (!response.ok || !data.ok) throw new Error("refresh_failed");
			saveTokens(data);
			return true;
		}).catch(() => {
			clearSession();
			return false;
		}).finally(() => { refreshPromise = null; });
	}
	return refreshPromise;
}

async function request(url, options = {}, retry = true) {
	const controller = new AbortController();
	const externalSignal = options.signal;
	const abortFromExternal = () => controller.abort(externalSignal?.reason);
	if (externalSignal?.aborted) abortFromExternal();
	else externalSignal?.addEventListener("abort", abortFromExternal, { once: true });
	const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
	const headers = new Headers(options.headers || {});
	if (options.body && !(options.body instanceof FormData) && !headers.has("content-type")) headers.set("content-type", "application/json");
	if (accessToken()) headers.set("authorization", `Bearer ${accessToken()}`);
	try {
		const response = await fetch(url, { ...options, headers, signal: controller.signal });
		if (response.status === 401 && retry && refreshToken()) {
			if (await refreshAccessToken()) return request(url, options, false);
		}
		const data = await parseResponse(response);
		if (!response.ok || data.ok === false) {
			throw new ApiError(data.message || "Permintaan tidak dapat diproses", {
				status: response.status, code: data.code, requestId: data.request_id, details: data,
			});
		}
		return data;
	} catch (error) {
		if (error instanceof ApiError) throw error;
		if (error.name === "AbortError" && externalSignal?.aborted) throw new ApiError("Permintaan dibatalkan", { code: "request_aborted" });
		if (error.name === "AbortError") throw new ApiError("Server terlalu lama merespons", { code: "timeout" });
		throw new ApiError("Tidak dapat terhubung ke server", { code: "network_error" });
	} finally {
		clearTimeout(timeout);
		externalSignal?.removeEventListener("abort", abortFromExternal);
	}
}

export const api = {
	get(path) { return request(apiPath(path)); },
	post(path, body = {}, { idempotent = false, headers = {} } = {}) {
		if (idempotent) headers = { ...headers, "idempotency-key": body.idempotency_key || crypto.randomUUID() };
		return request(apiPath(path), { method: "POST", headers, body: JSON.stringify(body) });
	},
	patch(path, body = {}) { return request(apiPath(path), { method: "PATCH", body: JSON.stringify(body) }); },
	request,
};

export const authApi = {
	post(path, body) { return request(authPath(path), { method: "POST", body: JSON.stringify(body) }, false); },
	get(path) { return request(authPath(path), {}, false); },
};
