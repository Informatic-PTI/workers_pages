import { randomId } from "../lib/crypto.js";
import { normalizeEmail, normalizePhone } from "../lib/phone.js";
import { httpError } from "../lib/response.js";
import { normalizeLicensePlate, optionalText, positiveInteger, requiredText } from "../lib/validation.js";
import {
	findCustomerByPhone,
	findVehicleByPlate,
	getCustomer,
	getVehicle,
	insertCustomer,
	insertVehicle,
	listCustomers,
	listVehicles,
	updateCustomer,
	updateVehicle,
	vehicleServiceHistory,
} from "../repositories/customersRepository.js";

function customerPayload(body, requestId, current = {}) {
	const phone = normalizePhone(body.phone ?? current.phone);
	if (!phone) throw httpError("validation_error", "Nomor telepon tidak valid", 400, requestId, { field: "phone" });
	const rawEmail = body.email ?? current.email;
	const email = rawEmail ? normalizeEmail(rawEmail) : null;
	if (rawEmail && !email) throw httpError("validation_error", "Email tidak valid", 400, requestId, { field: "email" });
	return {
		name: requiredText(body.name ?? current.name, "name", requestId, 120),
		phone,
		email,
		address: optionalText(body.address ?? current.address, 500),
		status: (body.status ?? current.status) === "inactive" ? "inactive" : "active",
	};
}

export async function customersList(env, query) {
	return listCustomers(env, query);
}

export async function customerDetail(env, id, requestId) {
	const customer = await getCustomer(env, id);
	if (!customer) throw httpError("not_found", "Pelanggan tidak ditemukan", 404, requestId);
	const vehicles = await listVehicles(env, { customerId: id, q: "", limit: 100, offset: 0 });
	return { ...customer, vehicles: vehicles.items };
}

export async function customerCreate(env, body, requestId) {
	const payload = customerPayload(body, requestId);
	const duplicate = await findCustomerByPhone(env, payload.phone);
	if (duplicate) throw httpError("customer_duplicate", "Pelanggan dengan nomor telepon tersebut sudah ada", 409, requestId, { existing_id: duplicate.id });
	return insertCustomer(env, { id: randomId("cus", 10), ...payload });
}

export async function customerUpdate(env, id, body, requestId) {
	const current = await getCustomer(env, id);
	if (!current) throw httpError("not_found", "Pelanggan tidak ditemukan", 404, requestId);
	const payload = customerPayload(body, requestId, current);
	const duplicate = await findCustomerByPhone(env, payload.phone);
	if (duplicate && duplicate.id !== id) throw httpError("customer_duplicate", "Nomor telepon sudah digunakan pelanggan lain", 409, requestId);
	return updateCustomer(env, id, payload);
}

export async function vehiclesList(env, query) {
	return listVehicles(env, query);
}

export async function vehicleDetail(env, id, requestId) {
	const vehicle = await getVehicle(env, id);
	if (!vehicle) throw httpError("not_found", "Kendaraan tidak ditemukan", 404, requestId);
	return { ...vehicle, service_history: await vehicleServiceHistory(env, id) };
}

function vehiclePayload(body, requestId, current = {}) {
	const yearRaw = body.year ?? current.year;
	const year = yearRaw ? positiveInteger(Number(yearRaw), "year", requestId) : null;
	if (year && (year < 1950 || year > new Date().getFullYear() + 1)) throw httpError("validation_error", "Tahun kendaraan tidak valid", 400, requestId, { field: "year" });
	return {
		customer_id: requiredText(body.customer_id ?? current.customer_id, "customer_id", requestId, 80),
		brand: requiredText(body.brand ?? current.brand, "brand", requestId, 80),
		model: requiredText(body.model ?? current.model, "model", requestId, 120),
		year,
		license_plate: normalizeLicensePlate(body.license_plate ?? current.license_plate, requestId),
		color: optionalText(body.color ?? current.color, 60),
		odometer: positiveInteger(body.odometer ?? current.odometer ?? 0, "odometer", requestId, { allowZero: true }),
	};
}

export async function vehicleCreate(env, body, requestId) {
	const payload = vehiclePayload(body, requestId);
	if (!await getCustomer(env, payload.customer_id)) throw httpError("not_found", "Pelanggan tidak ditemukan", 404, requestId);
	const duplicate = await findVehicleByPlate(env, payload.license_plate);
	if (duplicate) throw httpError("vehicle_duplicate", "Nomor polisi sudah terdaftar", 409, requestId, { existing_id: duplicate.id });
	return insertVehicle(env, { id: randomId("veh", 10), ...payload });
}

export async function vehicleUpdateService(env, id, body, requestId) {
	const current = await getVehicle(env, id);
	if (!current) throw httpError("not_found", "Kendaraan tidak ditemukan", 404, requestId);
	const payload = vehiclePayload(body, requestId, current);
	if (!await getCustomer(env, payload.customer_id)) throw httpError("not_found", "Pelanggan tidak ditemukan", 404, requestId);
	const duplicate = await findVehicleByPlate(env, payload.license_plate);
	if (duplicate && duplicate.id !== id) throw httpError("vehicle_duplicate", "Nomor polisi sudah terdaftar", 409, requestId);
	return updateVehicle(env, id, payload);
}
