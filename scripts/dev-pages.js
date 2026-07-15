#!/usr/bin/env node
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(projectRoot, "public");
const wranglerCli = resolve(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const tempRoot = resolve(tmpdir());
const tempDir = mkdtempSync(resolve(tempRoot, "irwanmotor-pages-"));

const tempRelative = relative(tempRoot, resolve(tempDir));
if (tempRelative.startsWith("..") || isAbsolute(tempRelative)) {
	throw new Error("unsafe_pages_preview_directory");
}

const ignoredRoots = new Set(readFileSync(resolve(publicDir, ".assetsignore"), "utf8")
	.split(/\r?\n/)
	.map((line) => line.trim().replace(/\/$/, ""))
	.filter((line) => line && !line.startsWith("#")));
const stagedPublic = resolve(tempDir, "public");
cpSync(publicDir, stagedPublic, {
	recursive: true,
	filter(source) {
		const relativeSource = relative(publicDir, source);
		if (!relativeSource) return true;
		const root = relativeSource.split(/[\\/]/)[0];
		return root !== ".wrangler" && root !== ".assetsignore" && !ignoredRoots.has(root);
	},
});
writeFileSync(resolve(stagedPublic, "_worker.js"), `
export class RateLimitDO {}
export class SessionGuardDO {}
export default { fetch(request, env) { return env.ASSETS.fetch(request); } };
`, "utf8");

const previewEnv = { ...process.env, PWD: tempDir };
delete previewEnv.INIT_CWD;
delete previewEnv.npm_config_local_prefix;

const child = spawn(process.execPath, [
	wranglerCli, "pages", "dev", stagedPublic,
	"--port", "8788", "--ip", "127.0.0.1", "--compatibility-date", "2026-07-15", "--cwd", tempDir,
], {
	cwd: tempDir,
	env: previewEnv,
	stdio: "inherit",
});

function cleanup() {
	rmSync(tempDir, { recursive: true, force: true });
}

child.on("exit", (code, signal) => {
	cleanup();
	if (signal) process.kill(process.pid, signal);
	else process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => child.kill(signal));
}
