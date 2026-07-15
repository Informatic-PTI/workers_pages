const routes = [];
let handler = null;

export function registerRoute(pattern, page, options = {}) {
	const keys = [];
	const expression = pattern.replace(/:[^/]+/g, (match) => { keys.push(match.slice(1)); return "([^/]+)"; });
	routes.push({ regex: new RegExp(`^${expression}$`), keys, page, ...options });
}

export function onRoute(callback) { handler = callback; }

export function currentRoute() {
	const raw = location.hash.slice(1) || "/dashboard";
	const [path, queryString = ""] = raw.split("?");
	for (const route of routes) {
		const match = path.match(route.regex);
		if (!match) continue;
		return {
			...route,
			path,
			params: Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])])),
			query: Object.fromEntries(new URLSearchParams(queryString)),
		};
	}
	return null;
}

export function navigate(path, { replace = false } = {}) {
	const hash = `#${path.startsWith("/") ? path : `/${path}`}`;
	if (replace) location.replace(hash); else location.hash = hash;
}

export function startRouter() {
	const dispatch = () => handler?.(currentRoute());
	window.addEventListener("hashchange", dispatch);
	dispatch();
}
