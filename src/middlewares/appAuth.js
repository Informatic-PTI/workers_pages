import { rolesForUser, hasPermission } from "../db/permissions.js";
import { requireAuth } from "../lib/guard.js";
import { httpError } from "../lib/response.js";

export async function requireAppAuth(request, env, requestId, { roles = [], permission = null } = {}) {
	const auth = await requireAuth(request, env, requestId);
	const roleKeys = auth.user.is_hyperuser ? ["admin", "hyperuser"] : await rolesForUser(env, auth.user.id);
	const roleAllowed = roles.length === 0 || roles.some((role) => roleKeys.includes(role));
	const permissionAllowed = !permission || await hasPermission(env, auth.user, permission);
	if (!roleAllowed || !permissionAllowed) {
		throw httpError("forbidden", "Anda tidak memiliki akses untuk tindakan ini", 403, requestId);
	}
	return { ...auth, roles: roleKeys };
}
