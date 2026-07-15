import { httpError } from "./response.js";

export function requiredText(value, field, requestId, maxLength = 500) {
	const text = String(value ?? "").trim();
	if (!text) throw httpError("validation_error", `${field} wajib diisi`, 400, requestId, { field });
	if (text.length > maxLength) throw httpError("validation_error", `${field} terlalu panjang`, 400, requestId, { field });
	return text;
}

export function optionalText(value, maxLength = 500) {
	if (value === null || value === undefined || value === "") return null;
	return String(value).trim().slice(0, maxLength) || null;
}

export function positiveInteger(value, field, requestId, { allowZero = false } = {}) {
	const number = Number(value);
	if (!Number.isInteger(number) || (allowZero ? number < 0 : number <= 0)) {
		throw httpError("validation_error", `${field} harus berupa bilangan ${allowZero ? "non-negatif" : "positif"}`, 400, requestId, { field });
	}
	return number;
}

export function enumValue(value, allowed, field, requestId, fallback = undefined) {
	const normalized = String(value ?? fallback ?? "").trim().toLowerCase();
	if (!allowed.includes(normalized)) {
		throw httpError("validation_error", `${field} tidak valid`, 400, requestId, { field, allowed });
	}
	return normalized;
}

export function normalizeLicensePlate(value, requestId) {
	const plate = requiredText(value, "license_plate", requestId, 16).toUpperCase().replace(/\s+/g, " ");
	if (!/^[A-Z]{1,2}\s?\d{1,4}\s?[A-Z]{0,3}$/.test(plate)) {
		throw httpError("validation_error", "Format nomor polisi tidak valid", 400, requestId, { field: "license_plate" });
	}
	return plate;
}

export function isoDateTime(value, field, requestId) {
	const date = new Date(value);
	if (!value || Number.isNaN(date.getTime())) throw httpError("validation_error", `${field} tidak valid`, 400, requestId, { field });
	return date.toISOString();
}

export function pagination(url) {
	const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") || "25", 10) || 25, 1), 100);
	const page = Math.max(Number.parseInt(url.searchParams.get("page") || "1", 10) || 1, 1);
	return { limit, page, offset: (page - 1) * limit };
}

export function idempotencyKey(request, body, requestId) {
	const value = request.headers.get("idempotency-key") || body?.idempotency_key;
	return requiredText(value, "idempotency_key", requestId, 120);
}
