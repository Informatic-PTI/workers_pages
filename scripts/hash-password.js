#!/usr/bin/env node
import { webcrypto } from "node:crypto";
import { hashPassword } from "../src/lib/password.js";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

const password = process.argv[2];
if (!password) {
	console.error("Usage: PASSWORD_PEPPER=... node scripts/hash-password.js <password>");
	process.exit(1);
}

const env = {
	PASSWORD_PEPPER: process.env.PASSWORD_PEPPER || "",
	PASSWORD_PBKDF2_ITERATIONS: process.env.PASSWORD_PBKDF2_ITERATIONS || "100000",
};

const hash = await hashPassword(env, password);
console.log(JSON.stringify(hash, null, 2));
