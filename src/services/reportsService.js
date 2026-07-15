import { httpError } from "../lib/response.js";
import { analyticsReport } from "../repositories/reportsRepository.js";
import { cacheKeys, readAppCache, writeAppCache } from "../lib/appCache.js";

export async function reportAnalytics(env, from, to, requestId) {
	const end = to || new Date().toISOString().slice(0, 10);
	const start = from || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
	if (Number.isNaN(new Date(start).getTime()) || Number.isNaN(new Date(end).getTime()) || start > end) {
		throw httpError("validation_error", "Rentang tanggal tidak valid", 400, requestId);
	}
	const key = cacheKeys.report(start, end);
	const cached = await readAppCache(env, key);
	if (cached) return cached;
	const report = { from: start, to: end, ...await analyticsReport(env, start, end) };
	await writeAppCache(env, key, report, 60);
	return report;
}
