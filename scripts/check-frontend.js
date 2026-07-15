#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "public");
const jsRoot = join(root, "js");
const failures = [];

function walk(directory) {
	return readdirSync(directory).flatMap((name) => {
		const path = join(directory, name);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});
}

const modules = walk(jsRoot).filter((path) => path.endsWith(".js"));
for (const modulePath of modules) {
	const source = readFileSync(modulePath, "utf8");
	for (const match of source.matchAll(/(?:import|export)\s+(?:[^"']+?\s+from\s+)?["']([^"']+)["']/g)) {
		if (!match[1].startsWith(".")) continue;
		const imported = normalize(resolve(dirname(modulePath), match[1]));
		if (!existsSync(imported)) failures.push(`Missing import: ${modulePath} -> ${match[1]}`);
	}
	if (/https?:\/\//.test(source)) failures.push(`Raw absolute URL in frontend module: ${modulePath}`);
	if (/\benv\.(?:DB|CACHE|BUCKET|AUTH_DB|AUTH_CACHE)\b/.test(source)) failures.push(`Cloudflare binding leaked to frontend: ${modulePath}`);
}

const index = readFileSync(join(root, "index.html"), "utf8");
for (const match of index.matchAll(/(?:href|src)="(\/(?:css|js)\/[^"?#]+)"/g)) {
	if (!existsSync(join(root, match[1]))) failures.push(`Missing index asset: ${match[1]}`);
}
if (/tailwind|cdn\.jsdelivr|bootstrap/i.test(index)) failures.push("Application shell references a forbidden CSS framework/CDN.");

const app = readFileSync(join(jsRoot, "app.js"), "utf8");
const requiredRoutes = [
	"/login", "/dashboard", "/bookings", "/bookings/new", "/customers", "/vehicles", "/mechanics",
	"/service-orders", "/my-work", "/spare-parts", "/inventory/stock-in", "/inventory/receipts",
	"/inventory/receipts/:id", "/suppliers", "/cashier", "/transactions",
	"/reports", "/notifications", "/activity", "/profile", "/settings",
];
for (const route of requiredRoutes) {
	if (!app.includes(`registerRoute("${route}"`)) failures.push(`Missing route registration: ${route}`);
}

const client = readFileSync(join(jsRoot, "api", "client.js"), "utf8");
if (!client.includes("apiPath(path)")) failures.push("API client does not use the shared API path configuration.");
if (!client.includes("response.status === 401")) failures.push("API client does not handle unauthorized responses.");
const authService = readFileSync(join(jsRoot, "services", "auth.js"), "utf8");
if (!authService.includes('authApi.post("/login/password"')) failures.push("Login does not call the existing password auth endpoint.");
if (!app.includes("shell(") || !app.includes("mountShell(")) failures.push("Shared authenticated application shell is not mounted by the router.");
if (!app.includes("route.roles") || !app.includes("currentRoles()")) failures.push("Frontend route role checks are missing.");
const shell = readFileSync(join(jsRoot, "components", "shell.js"), "utf8");
for (const role of ["admin", "mechanic", "cashier"]) if (!shell.includes(`${role}: [`)) failures.push(`Missing navigation definition for role: ${role}`);

if (failures.length) {
	console.error(failures.join("\n"));
	process.exit(1);
}

console.log(`Frontend check passed: ${modules.length} modules, ${requiredRoutes.length} primary routes, auth compatibility, unauthorized handling, shared shell, local assets, and role guards.`);
