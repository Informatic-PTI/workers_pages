import {
	createCustomerController, createVehicleController, getCustomerController, getVehicleController,
	listCustomersController, listVehiclesController, updateCustomerController, updateVehicleController,
} from "../controllers/customersController.js";
import {
	assignServiceOrderController, checkInBookingController, completeTaskController, createBookingController, createTaskController, dashboardController,
	createMechanicController,
	getBookingController, getServiceOrderController, listBookingsController, listServiceOrdersController,
	mechanicsController, transitionServiceOrderController, updateBookingController, updateMechanicController,
} from "../controllers/workshopController.js";
import {
	addServicePartController, createSparePartController, getSparePartController, listSparePartsController,
	createSupplierController, getStockReceiptController, listStockReceiptsController, movementController,
	stockReceiptController, suppliersController, updateSparePartController, updateSupplierController,
} from "../controllers/inventoryController.js";
import {
	createInvoiceController, getInvoiceController, listInvoicesController, payInvoiceController,
	providersController, transactionsController,
} from "../controllers/billingController.js";
import { listNotificationsController, readAllNotificationsController, readNotificationController } from "../controllers/notificationsController.js";
import { activityController, analyticsController } from "../controllers/reportsController.js";
import { downloadAttachmentController, uploadAttachmentController } from "../controllers/attachmentsController.js";
import {
	communicationProvidersController, sendEmailController, sendWhatsAppController, whatsappHealthController,
} from "../controllers/providersController.js";
import { notFound } from "../lib/response.js";

const ROUTES = [
	["GET", /^dashboard$/, dashboardController],
	["GET", /^mechanics$/, mechanicsController],
	["POST", /^mechanics$/, createMechanicController],
	["PATCH", /^mechanics\/([^/]+)$/, updateMechanicController, ["id"]],
	["GET", /^customers$/, listCustomersController],
	["POST", /^customers$/, createCustomerController],
	["GET", /^customers\/([^/]+)$/, getCustomerController, ["id"]],
	["PATCH", /^customers\/([^/]+)$/, updateCustomerController, ["id"]],
	["GET", /^vehicles$/, listVehiclesController],
	["POST", /^vehicles$/, createVehicleController],
	["GET", /^vehicles\/([^/]+)$/, getVehicleController, ["id"]],
	["PATCH", /^vehicles\/([^/]+)$/, updateVehicleController, ["id"]],
	["GET", /^bookings$/, listBookingsController],
	["POST", /^bookings$/, createBookingController],
	["GET", /^bookings\/([^/]+)$/, getBookingController, ["id"]],
	["PATCH", /^bookings\/([^/]+)$/, updateBookingController, ["id"]],
	["POST", /^bookings\/([^/]+)\/check-in$/, checkInBookingController, ["id"]],
	["GET", /^service-orders$/, listServiceOrdersController],
	["GET", /^service-orders\/([^/]+)$/, getServiceOrderController, ["id"]],
	["PATCH", /^service-orders\/([^/]+)\/assignment$/, assignServiceOrderController, ["id"]],
	["POST", /^service-orders\/([^/]+)\/transition$/, transitionServiceOrderController, ["id"]],
	["POST", /^service-orders\/([^/]+)\/tasks$/, createTaskController, ["id"]],
	["POST", /^tasks\/([^/]+)\/complete$/, completeTaskController, ["id"]],
	["POST", /^service-orders\/([^/]+)\/parts$/, addServicePartController, ["id"]],
	["POST", /^service-orders\/([^/]+)\/invoice$/, createInvoiceController, ["id"]],
	["GET", /^spare-parts$/, listSparePartsController],
	["POST", /^spare-parts$/, createSparePartController],
	["GET", /^spare-parts\/([^/]+)$/, getSparePartController, ["id"]],
	["PATCH", /^spare-parts\/([^/]+)$/, updateSparePartController, ["id"]],
	["POST", /^spare-parts\/([^/]+)\/movements$/, movementController, ["id"]],
	["GET", /^suppliers$/, suppliersController],
	["POST", /^suppliers$/, createSupplierController],
	["PATCH", /^suppliers\/([^/]+)$/, updateSupplierController, ["id"]],
	["GET", /^stock-receipts$/, listStockReceiptsController],
	["POST", /^stock-receipts$/, stockReceiptController],
	["GET", /^stock-receipts\/([^/]+)$/, getStockReceiptController, ["id"]],
	["GET", /^invoices$/, listInvoicesController],
	["GET", /^invoices\/([^/]+)$/, getInvoiceController, ["id"]],
	["POST", /^invoices\/([^/]+)\/payments$/, payInvoiceController, ["id"]],
	["GET", /^transactions$/, transactionsController],
	["GET", /^providers$/, providersController],
	["GET", /^providers\/communications$/, communicationProvidersController],
	["GET", /^providers\/communications\/whatsapp\/health$/, whatsappHealthController],
	["POST", /^providers\/communications\/whatsapp$/, sendWhatsAppController],
	["POST", /^providers\/communications\/email$/, sendEmailController],
	["GET", /^notifications$/, listNotificationsController],
	["POST", /^notifications\/read-all$/, readAllNotificationsController],
	["POST", /^notifications\/([^/]+)\/read$/, readNotificationController, ["id"]],
	["GET", /^reports\/analytics$/, analyticsController],
	["GET", /^activity$/, activityController],
	["POST", /^attachments$/, uploadAttachmentController],
];

function paramsFrom(match, keys = []) {
	return Object.fromEntries(keys.map((key, index) => [key, decodeURIComponent(match[index + 1])]));
}

export async function handleApp(request, env, ctx, requestId, parts) {
	if (parts[0] === "files" && parts[1]) return downloadAttachmentController(request, env, ctx, requestId, { id: parts[1] });
	const path = parts.slice(2).join("/");
	for (const [method, pattern, controller, keys] of ROUTES) {
		if (request.method !== method) continue;
		const match = path.match(pattern);
		if (match) return controller(request, env, ctx, requestId, paramsFrom(match, keys));
	}
	return notFound(requestId);
}
