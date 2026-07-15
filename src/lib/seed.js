import { hashPassword } from "./password.js";
import { createPasswordCredential } from "../db/credentials.js";

export const seedServices = [
	["svc_profile", "profile", "Profile Service"],
	["svc_irwanmotor_auth", "irwanmotor-auth", "Irwan Motor Auth"],
	["svc_irwanmotor_app", "irwanmotor-app", "Irwan Motor App"],
	["svc_admin", "admin-panel", "Admin Panel"],
];

export const seedPermissions = [
	["perm_profile_access", "profile:access", "profile", "Access own profile"],
	["perm_profile_read", "profile:read", "profile", "Read own profile"],
	["perm_auth_admin", "auth:admin", "irwanmotor-auth", "Administer auth service"],
	["perm_dashboard_access", "dashboard:access", "admin-panel", "Access admin dashboard"],
	["perm_app_access", "app:access", "irwanmotor-app", "Access application"],
];

export async function seedInitial(env) {
	for (const service of seedServices) {
		await env.AUTH_DB.prepare("INSERT OR IGNORE INTO services (id,service_key,name) VALUES (?, ?, ?)").bind(...service).run();
	}
	for (const permission of seedPermissions) {
		await env.AUTH_DB.prepare(
			"INSERT OR IGNORE INTO permissions (id,permission_key,service_key,description) VALUES (?, ?, ?, ?)",
		).bind(...permission).run();
	}
	await env.AUTH_DB.prepare("INSERT OR IGNORE INTO roles (id,role_key,name,is_system) VALUES ('role_hyperuser','hyperuser','Hyperuser',1)").run();
	await env.AUTH_DB.prepare("INSERT OR IGNORE INTO roles (id,role_key,name,is_system) VALUES ('role_user_basic','user_basic','Basic User',1)").run();
	for (const permission of seedPermissions) {
		await env.AUTH_DB.prepare("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES ('role_hyperuser', ?)").bind(permission[0]).run();
	}
	await env.AUTH_DB.prepare("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES ('role_user_basic','perm_profile_access')").run();
	await env.AUTH_DB.prepare("INSERT OR IGNORE INTO role_permissions (role_id,permission_id) VALUES ('role_user_basic','perm_profile_read')").run();

	await env.AUTH_DB.prepare(
		`INSERT OR IGNORE INTO users (id,email,phone,username,display_name,status,is_hyperuser)
		 VALUES ('ATHTHAA', NULL, NULL, 'aththaa', 'Project Hyperuser', 'active', 1)`,
	).run();
	await env.AUTH_DB.prepare("INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES ('ATHTHAA','role_hyperuser')").run();
	await env.AUTH_DB.prepare(
		`INSERT INTO user_auth_settings (user_id, skip_otp, notes, updated_at)
		 VALUES ('ATHTHAA', 1, 'Bootstrap hyperuser. Add a phone and disable skip_otp to require OTP.', CURRENT_TIMESTAMP)
		 ON CONFLICT(user_id) DO UPDATE SET skip_otp = 1, updated_at = CURRENT_TIMESTAMP`,
	).run();

	const hyperCred = await env.AUTH_DB.prepare("SELECT id FROM credentials WHERE user_id = 'ATHTHAA' AND type = 'password'").first();
	if (!hyperCred) {
		if (!env.SEED_HYPERUSER_PASSWORD) throw new Error("seed_password_not_configured");
		await createPasswordCredential(env, "ATHTHAA", await hashPassword(env, env.SEED_HYPERUSER_PASSWORD));
	}
	return { users: ["ATHTHAA"], roles: ["hyperuser", "user_basic"], permissions: seedPermissions.length };
}
