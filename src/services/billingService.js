import { randomDigits, randomId } from "../lib/crypto.js";
import { httpError } from "../lib/response.js";
import { domainAudit } from "../lib/domainAudit.js";
import { enumValue, positiveInteger } from "../lib/validation.js";
import { createInvoice, getInvoice, getInvoiceByServiceOrder, getPaidPayment, getPaymentByIdempotency, listInvoices, payInvoice, paymentHistory, servicePartsTotal } from "../repositories/billingRepository.js";
import { getServiceOrder } from "../repositories/workshopRepository.js";

export async function invoicesList(env, query) { return listInvoices(env, query); }

export async function invoiceDetail(env, id, requestId) {
	const invoice = await getInvoice(env, id);
	if (!invoice) throw httpError("not_found", "Invoice tidak ditemukan", 404, requestId);
	return invoice;
}

export async function invoiceCreate(env, serviceOrderId, body, requestId, auth = null) {
	const existing = await getInvoiceByServiceOrder(env, serviceOrderId);
	if (existing) return { invoice: await getInvoice(env, existing.id), replayed: true };
	const order = await getServiceOrder(env, serviceOrderId);
	if (!order) throw httpError("not_found", "Service Order tidak ditemukan", 404, requestId);
	if (!["quality_check", "ready", "completed"].includes(order.status)) {
		throw httpError("invalid_transition", "Invoice hanya dapat dibuat setelah pekerjaan mencapai quality check", 409, requestId);
	}
	const laborAmount = positiveInteger(body.labor_amount ?? 0, "labor_amount", requestId, { allowZero: true });
	const partsAmount = await servicePartsTotal(env, serviceOrderId);
	const subtotal = laborAmount + partsAmount;
	const discount = positiveInteger(body.discount ?? 0, "discount", requestId, { allowZero: true });
	const tax = positiveInteger(body.tax ?? 0, "tax", requestId, { allowZero: true });
	if (discount > subtotal + tax) throw httpError("validation_error", "Diskon melebihi nilai invoice", 400, requestId);
	const id = randomId("inv", 10);
	try {
		const invoice = await createInvoice(env, {
			id, invoice_no: `INV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomDigits(4)}`,
			service_order_id: serviceOrderId, subtotal, discount, tax, total: subtotal + tax - discount,
		});
		if (auth) await domainAudit(env, { event_type: "invoice_created", user_id: auth.user.id, request_id: requestId, target_type: "invoice", target_id: invoice.id });
		return { invoice, replayed: false };
	} catch (error) {
		const concurrent = await getInvoiceByServiceOrder(env, serviceOrderId);
		if (concurrent) return { invoice: await getInvoice(env, concurrent.id), replayed: true };
		throw error;
	}
}

export async function paymentCreate(env, invoiceId, body, auth, requestId, key) {
	const replay = await getPaymentByIdempotency(env, key);
	if (replay) return { payment: replay, replayed: true };
	const invoice = await invoiceDetail(env, invoiceId, requestId);
	const paid = await getPaidPayment(env, invoiceId);
	if (paid || invoice.status === "paid") throw httpError("already_paid", "Invoice sudah dibayar", 409, requestId, { payment_id: paid?.id });
	if (invoice.status !== "unpaid") throw httpError("invalid_transition", "Invoice tidak dapat dibayar pada status ini", 409, requestId);
	const method = enumValue(body.method, ["cash", "qris", "transfer"], "method", requestId);
	if (method !== "cash") {
		throw httpError("provider_not_configured", `Pembayaran ${method.toUpperCase()} belum dikonfigurasi. Pilih metode tunai.`, 503, requestId, { provider: method });
	}
	let cashReceived = null;
	let changeAmount = null;
	if (method === "cash") {
		cashReceived = positiveInteger(body.cash_received, "cash_received", requestId);
		if (cashReceived < Number(invoice.total)) throw httpError("insufficient_cash", "Uang diterima kurang dari total invoice", 400, requestId);
		changeAmount = cashReceived - Number(invoice.total);
	}
	try {
		const payment = await payInvoice(env, {
			id: randomId("pay", 10), payment_no: `PAY-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomDigits(4)}`,
			invoice_id: invoiceId, method, amount: Number(invoice.total), cash_received: cashReceived,
			change_amount: changeAmount, idempotency_key: key, processed_by: auth.user.id,
		});
		await domainAudit(env, { event_type: "payment_processed", user_id: auth.user.id, request_id: requestId, target_type: "invoice", target_id: invoiceId });
		return { payment, replayed: false };
	} catch (error) {
		const concurrent = await getPaidPayment(env, invoiceId);
		if (concurrent) return { payment: concurrent, replayed: true };
		throw error;
	}
}

export async function paymentProviderStatus(env) {
	return {
		cash: { configured: true, mode: "direct" },
		qris: { configured: false, mode: "not_configured" },
		transfer: { configured: false, mode: "not_configured" },
	};
}

export async function transactionsList(env, query) { return paymentHistory(env, query); }
