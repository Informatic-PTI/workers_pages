import { randomId } from "../lib/crypto.js";
import { normalizeEmail, normalizePhone } from "../lib/phone.js";

export async function getPasswordCredential(env, userId) {
	return env.AUTH_DB.prepare(
		"SELECT * FROM credentials WHERE user_id = ? AND type = 'password' AND enabled = 1 ORDER BY created_at DESC LIMIT 1",
	).bind(userId).first();
}

function credentialFromRow(row) {
	if (!row?.credential_id) return null;
	return {
		id: row.credential_id,
		user_id: row.id,
		type: "password",
		secret_hash: row.credential_secret_hash,
		salt: row.credential_salt,
		hash_algorithm: row.credential_hash_algorithm,
		iterations: row.credential_iterations,
		enabled: row.credential_enabled,
	};
}

function userFromJoinedRow(row) {
	if (!row?.id) return null;
	return {
		id: row.id,
		email: row.email,
		phone: row.phone,
		username: row.username,
		display_name: row.display_name,
		status: row.status,
		is_hyperuser: row.is_hyperuser,
		created_at: row.created_at,
		updated_at: row.updated_at,
	};
}

export async function findUserAndPasswordCredentialByIdentifier(env, identifier) {
	const raw = String(identifier || "").trim();
	if (!raw) return { user: null, credential: null };
	let where = "u.id = ? OR u.username = ?";
	let values = [raw, raw];
	if (raw.includes("@")) {
		where = "u.email = ?";
		values = [normalizeEmail(raw)];
	} else {
		const phone = normalizePhone(raw);
		if (phone) {
			where = "u.phone = ?";
			values = [phone];
		}
	}
	const row = await env.AUTH_DB.prepare(
		`SELECT
			u.*,
			c.id AS credential_id,
			c.secret_hash AS credential_secret_hash,
			c.salt AS credential_salt,
			c.hash_algorithm AS credential_hash_algorithm,
			c.iterations AS credential_iterations,
			c.enabled AS credential_enabled
		 FROM users u
		 LEFT JOIN credentials c ON c.id = (
			SELECT id FROM credentials
			WHERE user_id = u.id AND type = 'password' AND enabled = 1
			ORDER BY created_at DESC
			LIMIT 1
		 )
		 WHERE ${where}
		 LIMIT 1`,
	).bind(...values).first();
	return { user: userFromJoinedRow(row), credential: credentialFromRow(row) };
}

export async function createPasswordCredential(env, userId, hash) {
	const id = randomId("cred", 16);
	await env.AUTH_DB.prepare(
		`INSERT INTO credentials (id,user_id,type,secret_hash,salt,hash_algorithm,iterations,enabled)
		 VALUES (?, ?, 'password', ?, ?, ?, ?, 1)`,
	).bind(id, userId, hash.secret_hash, hash.salt, hash.hash_algorithm, hash.iterations).run();
	return id;
}
