#!/usr/bin/env node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { webcrypto } from "node:crypto";
import { hashPassword } from "../src/lib/password.js";

if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

const local = process.argv.includes("--local");
const printOnly = process.argv.includes("--print");
const password = process.env.SEED_STAFF_PASSWORD;
if (!password && !printOnly) {
	console.error("SEED_STAFF_PASSWORD wajib diisi untuk membuat akun staf development.");
	process.exit(1);
}

const hashEnv = {
	PASSWORD_PEPPER: process.env.PASSWORD_PEPPER || "",
	PASSWORD_PBKDF2_ITERATIONS: process.env.PASSWORD_PBKDF2_ITERATIONS || "100000",
};

function q(value) {
	if (value === null || value === undefined) return "NULL";
	return `'${String(value).replaceAll("'", "''")}'`;
}

async function credential(id, userId) {
	if (!password) return "";
	const hash = await hashPassword(hashEnv, password);
	return `UPDATE credentials SET enabled=0, updated_at=CURRENT_TIMESTAMP
WHERE user_id=${q(userId)} AND type='password' AND id<>${q(id)};
INSERT INTO credentials (id,user_id,type,secret_hash,salt,hash_algorithm,iterations,enabled,created_at,updated_at)
VALUES (${q(id)},${q(userId)},'password',${q(hash.secret_hash)},${q(hash.salt)},${q(hash.hash_algorithm)},${hash.iterations},1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT(id) DO UPDATE SET
 user_id=excluded.user_id, secret_hash=excluded.secret_hash, salt=excluded.salt,
 hash_algorithm=excluded.hash_algorithm, iterations=excluded.iterations, enabled=1,
 created_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP;`;
}

const sql = [
	"PRAGMA foreign_keys = ON;",
	"INSERT OR IGNORE INTO users (id,email,phone,username,display_name,status,is_hyperuser) VALUES ('MECH001','rizky.dev@example.test','628111000001','rizky','Rizky Maulana','active',0);",
	"INSERT OR IGNORE INTO users (id,email,phone,username,display_name,status,is_hyperuser) VALUES ('CASH001','kasir.dev@example.test','628111000002','kasir','Siti Rahma','active',0);",
	"INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES ('ATHTHAA','role_admin');",
	"INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES ('MECH001','role_mechanic');",
	"INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES ('CASH001','role_cashier');",
	"INSERT INTO user_auth_settings (user_id,skip_otp,notes) VALUES ('MECH001',1,'Development mechanic') ON CONFLICT(user_id) DO UPDATE SET skip_otp=1;",
	"INSERT INTO user_auth_settings (user_id,skip_otp,notes) VALUES ('CASH001',1,'Development cashier') ON CONFLICT(user_id) DO UPDATE SET skip_otp=1;",
	await credential("cred_seed_mech", "MECH001"),
	await credential("cred_seed_cash", "CASH001"),
	"INSERT OR IGNORE INTO customers (id,name,phone,email,address) VALUES ('cus_andi','Andi Pratama','628123450001','andi@example.test','Jakarta Selatan');",
	"INSERT OR IGNORE INTO customers (id,name,phone,email,address) VALUES ('cus_rama','Rama Saputra','628123450002','rama@example.test','Jakarta Timur');",
	"INSERT OR IGNORE INTO vehicles (id,customer_id,brand,model,year,license_plate,color,odometer) VALUES ('veh_vario','cus_andi','Honda','Vario 160',2024,'B 4832 UZT','Hitam',12450);",
	"INSERT OR IGNORE INTO vehicles (id,customer_id,brand,model,year,license_plate,color,odometer) VALUES ('veh_aerox','cus_rama','Yamaha','Aerox 155',2023,'B 6721 KRG','Biru',18230);",
	"INSERT OR IGNORE INTO mechanics (id,user_id,name,phone,status,specialty) VALUES ('mech_rizky','MECH001','Rizky Maulana','628111000001','busy','CVT dan mesin');",
	"INSERT OR IGNORE INTO mechanics (id,user_id,name,phone,status,specialty) VALUES ('mech_dimas',NULL,'Dimas Pratama','628111000003','available','Kelistrikan');",
	"INSERT OR IGNORE INTO suppliers (id,name,phone,email) VALUES ('sup_federal','PT Federal Karyatama','62215550001','sales@federal.example.test');",
	"INSERT OR IGNORE INTO suppliers (id,name,phone,email) VALUES ('sup_mandiri','Mandiri Motor Parts','628121110003','order@mandiri.example.test');",
	"INSERT OR IGNORE INTO spare_parts (id,sku,name,category,purchase_price,selling_price,stock,minimum_stock,critical_stock,location) VALUES ('part_oil_fed','OIL-FED-10W40','Federal Ultratec 10W-40','Oli Mesin',47500,65000,24,10,5,'Rak A-01');",
	"INSERT OR IGNORE INTO spare_parts (id,sku,name,category,purchase_price,selling_price,stock,minimum_stock,critical_stock,location) VALUES ('part_vbelt','VB-VAR160','V-Belt Honda Vario 160','CVT',185000,235000,8,5,2,'Rak B-04');",
	"INSERT OR IGNORE INTO spare_parts (id,sku,name,category,purchase_price,selling_price,stock,minimum_stock,critical_stock,location) VALUES ('part_brake','BRK-HND-F','Kampas Rem Depan Honda','Rem',62000,85000,2,8,3,'Rak C-02');",
	"INSERT OR IGNORE INTO spare_part_compatibility (id,spare_part_id,brand,model,year_start,year_end) VALUES ('compat_oil_vario','part_oil_fed','Honda','Vario 160',2022,NULL);",
	"INSERT OR IGNORE INTO spare_part_compatibility (id,spare_part_id,brand,model,year_start,year_end) VALUES ('compat_oil_aerox','part_oil_fed','Yamaha','Aerox 155',2020,NULL);",
	"INSERT OR IGNORE INTO spare_part_compatibility (id,spare_part_id,brand,model,year_start,year_end) VALUES ('compat_vbelt_vario','part_vbelt','Honda','Vario 160',2022,NULL);",
	"INSERT OR IGNORE INTO spare_part_compatibility (id,spare_part_id,brand,model,year_start,year_end) VALUES ('compat_brake_vario','part_brake','Honda','Vario 160',2022,NULL);",
	"INSERT OR IGNORE INTO bookings (id,booking_no,customer_id,vehicle_id,scheduled_at,complaint,status,channel,idempotency_key,created_by) VALUES ('bkg_demo_active','BK-260715-024','cus_andi','veh_vario',datetime('now','-3 hours'),'Motor bergetar saat kecepatan rendah dan rem depan berbunyi.','checked_in','counter','seed:booking:active','ATHTHAA');",
	"INSERT OR IGNORE INTO bookings (id,booking_no,customer_id,vehicle_id,scheduled_at,complaint,status,channel,idempotency_key,created_by) VALUES ('bkg_demo_upcoming','BK-DEMO-NEXT','cus_rama','veh_aerox',datetime('now','+2 hours'),'Service berkala dan pemeriksaan CVT.','confirmed','whatsapp','seed:booking:upcoming','ATHTHAA');",
	"INSERT OR IGNORE INTO service_orders (id,order_no,booking_id,customer_id,vehicle_id,mechanic_id,complaint,inspection_notes,status,priority,started_at,created_by) VALUES ('so_demo_024','SO-260715-024','bkg_demo_active','cus_andi','veh_vario','mech_rizky','Motor bergetar saat kecepatan rendah dan rem depan berbunyi.','CVT kotor; kampas rem menipis.','in_progress','high',datetime('now','-2 hours'),'ATHTHAA');",
	"UPDATE bookings SET service_order_id='so_demo_024' WHERE id='bkg_demo_active';",
	"INSERT OR IGNORE INTO service_orders (id,order_no,customer_id,vehicle_id,mechanic_id,complaint,inspection_notes,status,priority,created_by) VALUES ('so_demo_021','SO-260715-021','cus_rama','veh_aerox','mech_dimas','Service berkala 18.000 km.','Penggantian oli dan pembersihan CVT.','ready','normal','ATHTHAA');",
	"INSERT OR IGNORE INTO service_tasks (id,service_order_id,name,description,status,assigned_mechanic_id,completed_at,completed_by) VALUES ('task_oil','so_demo_024','Ganti Oli Mesin','Perawatan berkala','completed','mech_rizky',datetime('now','-90 minutes'),'MECH001');",
	"INSERT OR IGNORE INTO service_tasks (id,service_order_id,name,description,status,assigned_mechanic_id) VALUES ('task_cvt','so_demo_024','Pembersihan CVT','Menangani getaran kecepatan rendah','in_progress','mech_rizky');",
	"INSERT OR IGNORE INTO service_tasks (id,service_order_id,name,description,status,assigned_mechanic_id) VALUES ('task_brake','so_demo_024','Pemeriksaan Rem Depan','Cek dan bersihkan kampas rem','pending','mech_rizky');",
	"INSERT OR IGNORE INTO service_order_parts (id,service_order_id,spare_part_id,quantity,unit_price,status) VALUES ('sop_seed_oil','so_demo_024','part_oil_fed',1,65000,'consumed');",
	"INSERT OR IGNORE INTO service_activities (id,service_order_id,event_type,description,user_id,created_at) VALUES ('act_seed_1','so_demo_024','check_in','Kendaraan check-in','ATHTHAA',datetime('now','-3 hours'));",
	"INSERT OR IGNORE INTO service_activities (id,service_order_id,event_type,description,user_id,created_at) VALUES ('act_seed_2','so_demo_024','status_changed','Service dimulai','MECH001',datetime('now','-2 hours'));",
	"INSERT OR IGNORE INTO invoices (id,invoice_no,service_order_id,subtotal,discount,tax,total,status) VALUES ('inv_demo_021','INV-20260715-021','so_demo_021',485000,0,0,485000,'unpaid');",
	"INSERT OR IGNORE INTO notifications (id,role_key,type,title,message,severity,action_url,created_at) VALUES ('not_low_stock','admin','inventory','Stok Kampas Rem Kritis','Kampas Rem Depan Honda tersisa 2 unit.','critical','/#/spare-parts/part_brake',datetime('now','-15 minutes'));",
	"INSERT OR IGNORE INTO notifications (id,role_key,type,title,message,severity,action_url,created_at) VALUES ('not_booking','admin','booking','Booking berikutnya 2 jam lagi','Rama Saputra dijadwalkan untuk Yamaha Aerox 155.','warning','/#/bookings',datetime('now','-30 minutes'));",
	"INSERT OR IGNORE INTO notifications (id,user_id,type,title,message,severity,action_url,created_at) VALUES ('not_task_rizky','MECH001','service','Pekerjaan aktif','Lanjutkan Pembersihan CVT pada SO-260715-024.','info','/#/service-orders/so_demo_024',datetime('now','-10 minutes'));",
].filter(Boolean);

const content = `${sql.join("\n")}\n`;
if (printOnly) {
	console.log(content);
	process.exit(0);
}

const dbName = process.env.AUTH_D1_NAME || "irwanmotor_auth_core";
const dir = mkdtempSync(join(tmpdir(), "irwanmotor-workshop-seed-"));
const file = join(dir, "seed-workshop.sql");
writeFileSync(file, content);
const args = ["wrangler", "d1", "execute", dbName, local ? "--local" : "--remote", "--file", file];
const result = spawnSync("npx", args, { stdio: "inherit", shell: true });
rmSync(dir, { recursive: true, force: true });
process.exit(result.status || 0);
