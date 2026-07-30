export const config = Object.freeze({
	apiBase: "/api/v1",
	authBase: "/auth",
	appName: "21 Motoshop",
	requestTimeoutMs: 15000,
});

export function apiPath(path) {
	return `${config.apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export function authPath(path) {
	return `${config.authBase}${path.startsWith("/") ? path : `/${path}`}`;
}
