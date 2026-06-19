import { randomDigits, randomId, sha256Hex, timingSafeEqual } from "./crypto.js";

export function newOtpChallengeId() {
	return randomId("otp", 16);
}

export function generateOtp() {
	return randomDigits(6);
}

export async function hashOtp(env, challengeId, otp) {
	return sha256Hex(`${challengeId}:${otp}:${env.OTP_PEPPER || ""}`);
}

export async function verifyOtpHash(env, challengeId, otp, expectedHash) {
	return timingSafeEqual(await hashOtp(env, challengeId, otp), expectedHash);
}
