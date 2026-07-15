PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	phone TEXT NOT NULL UNIQUE,
	email TEXT,
	address TEXT,
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
	id TEXT PRIMARY KEY,
	customer_id TEXT NOT NULL,
	brand TEXT NOT NULL,
	model TEXT NOT NULL,
	year INTEGER,
	license_plate TEXT NOT NULL UNIQUE,
	color TEXT,
	odometer INTEGER NOT NULL DEFAULT 0 CHECK (odometer >= 0),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS mechanics (
	id TEXT PRIMARY KEY,
	user_id TEXT UNIQUE,
	name TEXT NOT NULL,
	phone TEXT,
	status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'off_duty')),
	specialty TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookings (
	id TEXT PRIMARY KEY,
	booking_no TEXT NOT NULL UNIQUE,
	customer_id TEXT NOT NULL,
	vehicle_id TEXT NOT NULL,
	scheduled_at TEXT NOT NULL,
	complaint TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'cancelled', 'no_show')),
	channel TEXT NOT NULL DEFAULT 'counter',
	service_order_id TEXT UNIQUE,
	idempotency_key TEXT UNIQUE,
	created_by TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
	FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS service_orders (
	id TEXT PRIMARY KEY,
	order_no TEXT NOT NULL UNIQUE,
	booking_id TEXT UNIQUE,
	customer_id TEXT NOT NULL,
	vehicle_id TEXT NOT NULL,
	mechanic_id TEXT,
	complaint TEXT NOT NULL,
	inspection_notes TEXT,
	status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'inspection', 'approval', 'in_progress', 'quality_check', 'ready', 'completed', 'cancelled')),
	priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
	estimated_completion TEXT,
	started_at TEXT,
	completed_at TEXT,
	created_by TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
	FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
	FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
	FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS service_tasks (
	id TEXT PRIMARY KEY,
	service_order_id TEXT NOT NULL,
	name TEXT NOT NULL,
	description TEXT,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
	assigned_mechanic_id TEXT,
	completed_at TEXT,
	completed_by TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
	FOREIGN KEY (assigned_mechanic_id) REFERENCES mechanics(id) ON DELETE SET NULL,
	FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	phone TEXT,
	email TEXT,
	address TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spare_parts (
	id TEXT PRIMARY KEY,
	sku TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	category TEXT NOT NULL,
	purchase_price INTEGER NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
	selling_price INTEGER NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
	stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
	minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
	critical_stock INTEGER NOT NULL DEFAULT 0 CHECK (critical_stock >= 0),
	location TEXT,
	image_key TEXT,
	status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_order_parts (
	id TEXT PRIMARY KEY,
	service_order_id TEXT NOT NULL,
	spare_part_id TEXT NOT NULL,
	quantity INTEGER NOT NULL CHECK (quantity > 0),
	unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
	status TEXT NOT NULL DEFAULT 'allocated' CHECK (status IN ('requested', 'allocated', 'consumed', 'cancelled')),
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (service_order_id, spare_part_id),
	FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
	FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS inventory_movements (
	id TEXT PRIMARY KEY,
	spare_part_id TEXT NOT NULL,
	type TEXT NOT NULL CHECK (type IN ('stock_in', 'service_use', 'direct_sale', 'adjustment_in', 'adjustment_out', 'return')),
	reference_type TEXT,
	reference_id TEXT,
	delta INTEGER NOT NULL CHECK (delta <> 0),
	quantity_before INTEGER NOT NULL CHECK (quantity_before >= 0),
	quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
	note TEXT,
	idempotency_key TEXT NOT NULL UNIQUE,
	created_by TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE RESTRICT,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_receipts (
	id TEXT PRIMARY KEY,
	receipt_no TEXT NOT NULL UNIQUE,
	supplier_id TEXT NOT NULL,
	received_at TEXT NOT NULL,
	supplier_document_no TEXT,
	note TEXT,
	total_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
	status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'cancelled')),
	idempotency_key TEXT NOT NULL UNIQUE,
	created_by TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
	FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_receipt_items (
	id TEXT PRIMARY KEY,
	stock_receipt_id TEXT NOT NULL,
	spare_part_id TEXT NOT NULL,
	quantity INTEGER NOT NULL CHECK (quantity > 0),
	unit_cost INTEGER NOT NULL CHECK (unit_cost >= 0),
	subtotal INTEGER NOT NULL CHECK (subtotal >= 0),
	UNIQUE (stock_receipt_id, spare_part_id),
	FOREIGN KEY (stock_receipt_id) REFERENCES stock_receipts(id) ON DELETE CASCADE,
	FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS invoices (
	id TEXT PRIMARY KEY,
	invoice_no TEXT NOT NULL UNIQUE,
	service_order_id TEXT NOT NULL UNIQUE,
	subtotal INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
	discount INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
	tax INTEGER NOT NULL DEFAULT 0 CHECK (tax >= 0),
	total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
	status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'pending', 'paid', 'cancelled')),
	paid_at TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS payments (
	id TEXT PRIMARY KEY,
	payment_no TEXT NOT NULL UNIQUE,
	invoice_id TEXT NOT NULL,
	method TEXT NOT NULL CHECK (method IN ('cash', 'qris', 'transfer')),
	amount INTEGER NOT NULL CHECK (amount > 0),
	cash_received INTEGER,
	change_amount INTEGER,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
	provider_reference TEXT,
	idempotency_key TEXT NOT NULL UNIQUE,
	processed_by TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
	FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_paid_per_invoice
ON payments(invoice_id) WHERE status = 'paid';

CREATE TABLE IF NOT EXISTS notifications (
	id TEXT PRIMARY KEY,
	user_id TEXT,
	role_key TEXT,
	type TEXT NOT NULL,
	title TEXT NOT NULL,
	message TEXT NOT NULL,
	severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'critical')),
	action_url TEXT,
	read_at TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS service_activities (
	id TEXT PRIMARY KEY,
	service_order_id TEXT NOT NULL,
	event_type TEXT NOT NULL,
	description TEXT NOT NULL,
	user_id TEXT,
	metadata_json TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
	FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attachments (
	id TEXT PRIMARY KEY,
	entity_type TEXT NOT NULL,
	entity_id TEXT NOT NULL,
	object_key TEXT NOT NULL UNIQUE,
	content_type TEXT NOT NULL,
	size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
	uploaded_by TEXT,
	created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_schedule_status ON bookings(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_service_orders_mechanic ON service_orders(mechanic_id, status);
CREATE INDEX IF NOT EXISTS idx_service_tasks_order ON service_tasks(service_order_id, status);
CREATE INDEX IF NOT EXISTS idx_spare_parts_stock ON spare_parts(stock, minimum_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_part_time ON inventory_movements(spare_part_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_role_read ON notifications(role_key, read_at, created_at);
CREATE INDEX IF NOT EXISTS idx_service_activities_order ON service_activities(service_order_id, created_at);

INSERT OR IGNORE INTO roles (id, role_key, name, is_system) VALUES
	('role_admin', 'admin', 'Administrator', 1),
	('role_mechanic', 'mechanic', 'Mechanic', 1),
	('role_cashier', 'cashier', 'Cashier', 1);

INSERT OR IGNORE INTO permissions (id, permission_key, service_key, description) VALUES
	('perm_workshop_read', 'workshop:read', 'irwanmotor-app', 'Read workshop operational data'),
	('perm_booking_manage', 'booking:manage', 'irwanmotor-app', 'Manage bookings'),
	('perm_service_manage', 'service:manage', 'irwanmotor-app', 'Manage service orders'),
	('perm_customer_manage', 'customer:manage', 'irwanmotor-app', 'Manage customers and vehicles'),
	('perm_inventory_manage', 'inventory:manage', 'irwanmotor-app', 'Manage inventory'),
	('perm_payment_manage', 'payment:manage', 'irwanmotor-app', 'Manage invoices and payments'),
	('perm_report_read', 'report:read', 'irwanmotor-app', 'Read operational reports'),
	('perm_notification_read', 'notification:read', 'irwanmotor-app', 'Read notifications');

INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 'role_admin', id FROM permissions WHERE service_key = 'irwanmotor-app';

INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
	('role_mechanic', 'perm_workshop_read'),
	('role_mechanic', 'perm_service_manage'),
	('role_mechanic', 'perm_notification_read'),
	('role_cashier', 'perm_workshop_read'),
	('role_cashier', 'perm_customer_manage'),
	('role_cashier', 'perm_payment_manage'),
	('role_cashier', 'perm_notification_read');
