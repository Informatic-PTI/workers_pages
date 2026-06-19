#!/usr/bin/env node
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { webcrypto } from "node:crypto";
import { hashPassword } from "../src/lib/password.js";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

const env = {
	PASSWORD_PEPPER: process.env.PASSWORD_PEPPER || "",
	PASSWORD_PBKDF2_ITERATIONS: process.env.PASSWORD_PBKDF2_ITERATIONS || "100000",
};

const hyperuserId = process.env.SEED_HYPERUSER_ID || "ATHTHAA";
const hyperuserPassword = process.env.SEED_HYPERUSER_PASSWORD || "awikwok123";

function q(value) {
	if (value === null || value === undefined) return "NULL";
	return `'${String(value).replaceAll("'", "''")}'`;
}

async function credentialSql(id, userId, password) {
	const hash = await hashPassword(env, password);
	return `INSERT INTO credentials (id,user_id,type,secret_hash,salt,hash_algorithm,iterations,enabled)
SELECT ${q(id)}, ${q(userId)}, 'password', ${q(hash.secret_hash)}, ${q(hash.salt)}, ${q(hash.hash_algorithm)}, ${hash.iterations}, 1
WHERE NOT EXISTS (SELECT 1 FROM credentials WHERE user_id = ${q(userId)} AND type = 'password');`;
}

const sql = [];
sql.push("PRAGMA foreign_keys = ON;");
for (const row of [
	["svc_profile", "profile", "Profile Service"],
	["svc_irwanmotor_auth", "irwanmotor-auth", "Irwan Motor Auth"],
	["svc_irwanmotor_app", "irwanmotor-app", "Irwan Motor App"],
	["svc_admin", "admin-panel", "Admin Panel"],
]) sql.push(`INSERT OR IGNORE INTO services (id,service_key,name) VALUES (${row.map(q).join(", ")});`);

for (const row of [
	["perm_profile_access", "profile:access", "profile", "Access own profile"],
	["perm_profile_read", "profile:read", "profile", "Read own profile"],
	["perm_auth_admin", "auth:admin", "irwanmotor-auth", "Administer auth service"],
	["perm_dashboard_access", "dashboard:access", "admin-panel", "Access admin dashboard"],
	["perm_app_access", "app:access", "irwanmotor-app", "Access application"],
]) sql.push(`INSERT OR IGNORE INTO permissions (id,permission_key,service_key,description) VALUES (${row.map(q).join(", ")});`);

sql.push("INSERT OR IGNORE INTO roles (id,role_key,name,is_system) VALUES ('role_hyperuser','hyperuser','Hyperuser',1);");
sql.push("INSERT OR IGNORE INTO roles (id,role_key,name,is_system) VALUES ('role_user_basic','user_basic','Basic User',1);");
for (const pid of ["perm_profile_access", "perm_profile_read", "perm_auth_admin", "perm_dashboard_access", "perm_app_access"]) {
	sql.push(`INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES ('role_hyperuser', ${q(pid)});`);
}
sql.push("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES ('role_user_basic','perm_profile_access');");
sql.push("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES ('role_user_basic','perm_profile_read');");
sql.push(`INSERT OR IGNORE INTO users (id,email,phone,username,display_name,status,is_hyperuser) VALUES (${q(hyperuserId)},NULL,NULL,'aththaa','Project Hyperuser','active',1);`);
sql.push(`INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES (${q(hyperuserId)},'role_hyperuser');`);
sql.push(`INSERT INTO user_auth_settings (user_id,skip_otp,notes,updated_at)
VALUES (${q(hyperuserId)},1,'Bootstrap hyperuser. Add a phone and disable skip_otp to require OTP.',CURRENT_TIMESTAMP)
ON CONFLICT(user_id) DO UPDATE SET skip_otp = 1, updated_at = CURRENT_TIMESTAMP;`);
sql.push(await credentialSql("cred_seed_hyperuser", hyperuserId, hyperuserPassword));

const content = `${sql.join("\n")}\n`;
if (process.argv.includes("--print")) {
	console.log(content);
	process.exit(0);
}

const dbName = process.env.AUTH_D1_NAME || "irwanmotor_auth_core";
const targetFlag = process.argv.includes("--local") ? "--local" : "--remote";
const dir = mkdtempSync(join(tmpdir(), "irwanmotor-auth-seed-"));
const file = join(dir, "seed.sql");
writeFileSync(file, content);
const result = spawnSync("npx", ["wrangler", "d1", "execute", dbName, targetFlag, "--file", file], { stdio: "inherit", shell: true });
rmSync(dir, { recursive: true, force: true });
process.exit(result.status || 0);
