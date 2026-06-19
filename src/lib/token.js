import { randomBase64Url, randomId, sha256Hex } from "./crypto.js";

export function newRefreshToken() {
	return randomBase64Url(48);
}

export async function hashRefreshToken(env, token) {
	return sha256Hex(`${token}${env.REFRESH_TOKEN_PEPPER || ""}`);
}

export function newSessionId() {
	return randomId("sess", 16);
}

export function newRefreshTokenId() {
	return randomId("rt", 16);
}

export function newFamilyId() {
	return randomId("rtfam", 16);
}
