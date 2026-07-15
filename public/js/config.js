export const config = Object.freeze({
	apiBase: "/api/v1",
	authBase: "/auth",
	appName: "Irwan Motor",
	requestTimeoutMs: 15000,
});

export function apiPath(path) {
	return `${config.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export function authPath(path) {
	return `${config.authBase}${path.startsWith("/") ? path : `/${path}`}`;
}
