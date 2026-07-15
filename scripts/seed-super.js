import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { unstable_splitSqlQuery } from "wrangler";

const databaseName = "irwanmotor_auth_core";
const locationFlag = process.argv.includes("--remote") ? "--remote" : "--local";
const unknownFlags = process.argv.slice(2).filter((flag) => !["--local", "--remote"].includes(flag));

if (process.argv.includes("--local") && process.argv.includes("--remote")) {
	throw new Error("Pilih salah satu target: --local atau --remote.");
}

if (unknownFlags.length > 0) {
	throw new Error(`Argumen tidak dikenal: ${unknownFlags.join(", ")}`);
}

const sourcePath = resolve("superseed.sql");
const wranglerPath = resolve("node_modules", "wrangler", "bin", "wrangler.js");
const statements = unstable_splitSqlQuery(readFileSync(sourcePath, "utf8"));
const chunkSize = 6;
const chunks = [];
let currentChunk = [];

for (const statement of statements) {
	const requiresDedicatedBatch = statement.length > 6000;

	if (currentChunk.length > 0 && (currentChunk.length >= chunkSize || requiresDedicatedBatch)) {
		chunks.push(currentChunk);
		currentChunk = [];
	}

	if (requiresDedicatedBatch) {
		chunks.push([statement]);
	} else {
		currentChunk.push(statement);
	}
}

if (currentChunk.length > 0) {
	chunks.push(currentChunk);
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), "irwanmotor-superseed-"));

try {
	console.log(`Menjalankan ${statements.length} statement superseed dalam ${chunks.length} batch ke ${locationFlag.slice(2)} D1.`);

	for (let index = 0; index < chunks.length; index += 1) {
		const chunkPath = join(temporaryDirectory, `batch-${String(index + 1).padStart(2, "0")}.sql`);
		writeFileSync(chunkPath, `${chunks[index].join(";\n\n")};\n`, "utf8");

		console.log(`Batch ${index + 1}/${chunks.length}`);
		const result = spawnSync(
			process.execPath,
			[wranglerPath, "d1", "execute", databaseName, locationFlag, "--file", chunkPath, "--yes"],
			{ stdio: "inherit" },
		);

		if (result.error) {
			throw result.error;
		}

		if (result.status !== 0) {
			throw new Error(`Superseed berhenti pada batch ${index + 1}/${chunks.length}. Jalankan kembali setelah masalah diperbaiki; statement bersifat idempotent.`);
		}
	}

	console.log("Superseed selesai. Semua batch berhasil dijalankan.");
} finally {
	rmSync(temporaryDirectory, { recursive: true, force: true });
}
