-- Bengkel Irwan Motor - comprehensive exhibition dataset
-- Compatible with Cloudflare D1 migrations 0001 through 0006.
-- Safe to run repeatedly: every showcase record uses a stable ID and INSERT OR IGNORE.
-- Run the auth/workshop seed scripts first when login credentials are required.
-- All contacts are fictional. Do not use this dataset for real messaging.
-- Spare-part SKU values below are internal demo inventory codes, not OEM part numbers.
-- D1 imports use implicit transactions; intentionally no BEGIN/COMMIT statements.

PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- Identity, application service, roles, and showcase staff
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO services (id, service_key, name, enabled) VALUES
	('svc_irwanmotor_app', 'irwanmotor-app', 'Irwan Motor Management System', 1);

INSERT OR IGNORE INTO users (id,email,phone,username,display_name,status,is_hyperuser,created_at) VALUES
	('ATHTHAA',NULL,NULL,'aththaa','Project Hyperuser','active',1,datetime('now','-180 days')),
	('MECH001','rizky.dev@example.test','628000009001','rizky','Rizky Maulana','active',0,datetime('now','-170 days')),
	('CASH001','kasir.dev@example.test','628000009002','kasir','Siti Rahma','active',0,datetime('now','-165 days')),
	('SS_MECH_ARIF','arif.demo@example.test','628000009003','arif.demo','Arif Setiawan','active',0,datetime('now','-150 days')),
	('SS_MECH_BAYU','bayu.demo@example.test','628000009004','bayu.demo','Bayu Kurniawan','active',0,datetime('now','-145 days')),
	('SS_MECH_EKO','eko.demo@example.test','628000009005','eko.demo','Eko Prasetyo','active',0,datetime('now','-140 days')),
	('SS_MECH_SATRIA','satria.demo@example.test','628000009006','satria.demo','Satria Wibowo','active',0,datetime('now','-135 days'));

INSERT OR IGNORE INTO user_roles (user_id,role_id) VALUES
	('ATHTHAA','role_admin'),
	('MECH001','role_mechanic'),
	('CASH001','role_cashier'),
	('SS_MECH_ARIF','role_mechanic'),
	('SS_MECH_BAYU','role_mechanic'),
	('SS_MECH_EKO','role_mechanic'),
	('SS_MECH_SATRIA','role_mechanic');

INSERT OR IGNORE INTO mechanics (id,user_id,name,phone,status,specialty,created_at) VALUES
	('mech_rizky','MECH001','Rizky Maulana','628000009001','busy','CVT, transmisi otomatis, dan tune-up',datetime('now','-160 days')),
	('ss_mech_arif','SS_MECH_ARIF','Arif Setiawan','628000009003','available','Kelistrikan, injeksi, dan diagnostic',datetime('now','-150 days')),
	('ss_mech_bayu','SS_MECH_BAYU','Bayu Kurniawan','628000009004','busy','Mesin, kaki-kaki, dan rem',datetime('now','-145 days')),
	('ss_mech_eko','SS_MECH_EKO','Eko Prasetyo','628000009005','busy','Servis berkala dan general repair',datetime('now','-140 days')),
	('ss_mech_satria','SS_MECH_SATRIA','Satria Wibowo','628000009006','off_duty','Ban, balancing, dan emergency service',datetime('now','-135 days'));

-- -----------------------------------------------------------------------------
-- Customers and vehicles
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO customers (id,name,phone,email,address,status,created_at) VALUES
	('ss_cus_001','Andika Pratama','6281200001001','andika.pratama@example.test','Jl. Tebet Barat Dalam No. 18, Jakarta Selatan','active',datetime('now','-120 days')),
	('ss_cus_002','Ramadhan Saputra','6281200001002','ramadhan.saputra@example.test','Jl. Balai Pustaka No. 27, Rawamangun','active',datetime('now','-110 days')),
	('ss_cus_003','Dimas Saputro','6281200001003','dimas.saputro@example.test','Jl. Kemang Raya No. 44, Jakarta Selatan','active',datetime('now','-98 days')),
	('ss_cus_004','Ayu Lestari','6281200001004','ayu.lestari@example.test','Jl. Margonda Raya No. 88, Depok','active',datetime('now','-92 days')),
	('ss_cus_005','Rudi Hartono','6281200001005','rudi.hartono@example.test','Perumahan Harapan Indah Blok C3, Bekasi','active',datetime('now','-85 days')),
	('ss_cus_006','Sari Wulandari','6281200001006','sari.wulandari@example.test','Jl. Pondok Kelapa Raya No. 12, Jakarta Timur','active',datetime('now','-78 days')),
	('ss_cus_007','Budi Santoso','6281200001007','budi.santoso@example.test','Jl. Ciledug Raya No. 51, Tangerang','active',datetime('now','-72 days')),
	('ss_cus_008','Nanda Putri','6281200001008','nanda.putri@example.test','Jl. Radio Dalam No. 36, Jakarta Selatan','active',datetime('now','-64 days')),
	('ss_cus_009','Yoga Pratama','6281200001009','yoga.pratama@example.test','Jl. Raya Bogor Km 24, Jakarta Timur','active',datetime('now','-57 days')),
	('ss_cus_010','Fajar Nugroho','6281200001010','fajar.nugroho@example.test','Jl. Juanda No. 105, Bekasi','active',datetime('now','-48 days')),
	('ss_cus_011','Dewi Anggraini','6281200001011','dewi.anggraini@example.test','Jl. Lenteng Agung No. 73, Jakarta Selatan','active',datetime('now','-38 days')),
	('ss_cus_012','Hendra Gunawan','6281200001012','hendra.gunawan@example.test','Jl. Meruya Ilir No. 29, Jakarta Barat','active',datetime('now','-30 days')),
	('ss_cus_013','Maya Kusuma','6281200001013','maya.kusuma@example.test','Jl. Bintaro Utama No. 17, Tangerang Selatan','active',datetime('now','-22 days')),
	('ss_cus_014','Rizal Firmansyah','6281200001014','rizal.firmansyah@example.test','Jl. Kukusan Raya No. 9, Depok','inactive',datetime('now','-16 days'));

INSERT OR IGNORE INTO vehicles (id,customer_id,brand,model,year,license_plate,color,odometer,created_at) VALUES
	('ss_veh_001','ss_cus_001','Honda','Vario 160',2024,'B 4833 UZT','Hitam Matte',12480,datetime('now','-119 days')),
	('ss_veh_002','ss_cus_002','Yamaha','Aerox 155 Connected',2023,'B 6722 KRG','Prestige Silver',18320,datetime('now','-109 days')),
	('ss_veh_003','ss_cus_003','Honda','BeAT Street',2022,'B 3158 TKM','Street Black',26750,datetime('now','-97 days')),
	('ss_veh_004','ss_cus_004','Honda','Vario 125',2021,'B 4281 PZA','Advance White',32110,datetime('now','-91 days')),
	('ss_veh_005','ss_cus_005','Yamaha','NMAX 155 Connected',2023,'B 5510 NMX','Maxi Signature Black',14770,datetime('now','-84 days')),
	('ss_veh_006','ss_cus_006','Yamaha','Mio M3 125',2020,'B 2914 MIO','Metallic Red',41850,datetime('now','-77 days')),
	('ss_veh_007','ss_cus_007','Honda','PCX 160',2024,'B 8081 PCX','Majestic Matte Red',8920,datetime('now','-71 days')),
	('ss_veh_008','ss_cus_008','Yamaha','Aerox 155',2022,'B 7442 ARX','Cyber City',22160,datetime('now','-63 days')),
	('ss_veh_009','ss_cus_009','Honda','Scoopy',2023,'B 6031 SCP','Fashion Brown',16950,datetime('now','-56 days')),
	('ss_veh_010','ss_cus_010','Suzuki','NEX II',2021,'B 3377 NEX','Titan Black',29840,datetime('now','-47 days')),
	('ss_veh_011','ss_cus_011','Honda','ADV 160',2024,'B 9182 ADV','Tough Matte Brown',11120,datetime('now','-37 days')),
	('ss_veh_012','ss_cus_012','Honda','Revo X',2019,'B 2108 RVO','Attractive Red',56400,datetime('now','-29 days')),
	('ss_veh_013','ss_cus_013','Yamaha','Fazzio Hybrid',2023,'B 4820 FZO','Cyan',13750,datetime('now','-21 days')),
	('ss_veh_014','ss_cus_014','Kawasaki','KLX 150',2020,'B 6703 KLX','Lime Green',24680,datetime('now','-15 days')),
	('ss_veh_015','ss_cus_001','Honda','Genio',2022,'B 3912 GNO','Radiant Red Black',19450,datetime('now','-45 days'));

-- -----------------------------------------------------------------------------
-- Suppliers and real-world product names with internal showcase SKUs
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO suppliers (id,name,phone,email,address,created_at) VALUES
	('ss_sup_001','PT Federal Karyatama - Demo Distributor','628000008001','federal.distributor@example.test','Kawasan Industri Pulogadung, Jakarta Timur',datetime('now','-150 days')),
	('ss_sup_002','Astra Otoparts - Demo Distributor','628000008002','astra.distributor@example.test','Kelapa Gading, Jakarta Utara',datetime('now','-148 days')),
	('ss_sup_003','Yamaha Parts - Demo Distributor','628000008003','yamaha.parts@example.test','Pulogadung, Jakarta Timur',datetime('now','-146 days')),
	('ss_sup_004','NGK dan Denso Parts - Demo Distributor','628000008004','ignition.parts@example.test','Cakung, Jakarta Timur',datetime('now','-144 days')),
	('ss_sup_005','Motul Lubricants - Demo Distributor','628000008005','motul.distributor@example.test','Cilandak, Jakarta Selatan',datetime('now','-142 days')),
	('ss_sup_006','Sumber Ban Motor - Demo Supplier','628000008006','ban.motor@example.test','Bekasi Barat, Bekasi',datetime('now','-140 days'));

INSERT OR IGNORE INTO spare_parts
	(id,sku,name,category,purchase_price,selling_price,stock,minimum_stock,critical_stock,location,status,created_at) VALUES
	('ss_part_001','OLI-FED-UT10W40-08','Federal Ultratec 10W-40 0.8 L','Oli Mesin',47500,65000,24,10,5,'Rak A-01','active',datetime('now','-90 days')),
	('ss_part_002','OLI-AHM-MPX2-10W30','AHM Oil MPX 2 10W-30 0.8 L','Oli Mesin',46500,65000,27,12,6,'Rak A-02','active',datetime('now','-90 days')),
	('ss_part_003','OLI-YML-SM10W40-10','Yamalube Super Matic 10W-40 1 L','Oli Mesin',52000,75000,20,10,5,'Rak A-03','active',datetime('now','-90 days')),
	('ss_part_004','OLI-MTL-SCTLE10W40-10','Motul Scooter LE 10W-40 1 L','Oli Mesin',95000,135000,16,8,4,'Rak A-04','active',datetime('now','-88 days')),
	('ss_part_005','BUSI-NGK-CPR9EA9','NGK CPR9EA-9','Busi',19500,35000,17,10,5,'Rak B-01','active',datetime('now','-86 days')),
	('ss_part_006','BUSI-DNS-U22EPR9','Denso U22EPR9','Busi',22000,35000,14,8,4,'Rak B-02','active',datetime('now','-86 days')),
	('ss_part_007','CVT-HGP-VBELT-VAR125','Honda Genuine Parts V-Belt Vario 125/150','CVT',178000,235000,7,10,4,'Rak C-01','active',datetime('now','-84 days')),
	('ss_part_008','CVT-YGP-VBELT-NMXARX','Yamaha Genuine Parts V-Belt NMAX/Aerox 155','CVT',245000,310000,6,8,3,'Rak C-02','active',datetime('now','-84 days')),
	('ss_part_009','REM-AHM-PAD-KVB','AHM Genuine Parts Kampas Rem Depan KVB','Sistem Rem',62000,85000,3,8,4,'Rak D-01','active',datetime('now','-82 days')),
	('ss_part_010','REM-YGP-PAD-NMAX','Yamaha Genuine Parts Kampas Rem Depan NMAX','Sistem Rem',68000,92000,7,8,3,'Rak D-02','active',datetime('now','-82 days')),
	('ss_part_011','AKI-GS-GTZ5S','GS Astra MF Gold GTZ5S','Aki',235000,310000,6,4,2,'Rak E-01','active',datetime('now','-80 days')),
	('ss_part_012','AKI-YSA-YTZ6V','Yuasa YTZ6V','Aki',255000,335000,4,4,2,'Rak E-02','active',datetime('now','-80 days')),
	('ss_part_013','FILTER-AHM-VAR160','Honda Genuine Parts Air Cleaner Vario 160','Filter Udara',38000,75000,10,6,3,'Rak F-01','active',datetime('now','-78 days')),
	('ss_part_014','FILTER-YGP-NMAX','Yamaha Genuine Parts Air Filter NMAX 155','Filter Udara',42000,95000,7,6,3,'Rak F-02','active',datetime('now','-78 days')),
	('ss_part_015','FLUID-PRE-DOT3-300','Prestone Brake Fluid DOT 3 300 ml','Cairan Rem',39000,55000,19,8,4,'Rak G-01','active',datetime('now','-76 days')),
	('ss_part_016','COOLANT-AHM-1L','AHM Coolant 1 L','Coolant',28500,45000,14,6,3,'Rak G-02','active',datetime('now','-76 days')),
	('ss_part_017','GEAROIL-YML-100','Yamalube Gear Motor Oil 100 ml','Oli Gardan',16500,25000,18,10,5,'Rak A-05','active',datetime('now','-74 days')),
	('ss_part_018','LAMP-OSR-HS1-3535','OSRAM HS1 Original 12V 35/35W','Lampu',32000,45000,14,8,4,'Rak H-01','active',datetime('now','-72 days')),
	('ss_part_019','BAN-MCH-CITYX-809014','Michelin City Extra 80/90-14','Ban',385000,525000,5,4,2,'Rak I-01','active',datetime('now','-70 days')),
	('ss_part_020','BAN-MCH-CITYX-909014','Michelin City Extra 90/90-14','Ban',410000,575000,5,4,2,'Rak I-02','active',datetime('now','-70 days'));

INSERT OR IGNORE INTO spare_part_compatibility (id,spare_part_id,brand,model,year_start,year_end) VALUES
	('ss_compat_001','ss_part_001','Honda','Vario 160',2022,NULL),
	('ss_compat_002','ss_part_001','Yamaha','Aerox 155',2020,NULL),
	('ss_compat_003','ss_part_002','Honda','BeAT Street',2020,NULL),
	('ss_compat_004','ss_part_002','Honda','Vario 125',2018,NULL),
	('ss_compat_005','ss_part_002','Honda','Scoopy',2020,NULL),
	('ss_compat_006','ss_part_003','Yamaha','NMAX 155',2020,NULL),
	('ss_compat_007','ss_part_003','Yamaha','Aerox 155',2020,NULL),
	('ss_compat_008','ss_part_003','Yamaha','Mio M3 125',2018,NULL),
	('ss_compat_009','ss_part_004','Suzuki','NEX II',2018,NULL),
	('ss_compat_010','ss_part_004','Honda','ADV 160',2022,NULL),
	('ss_compat_011','ss_part_005','Honda','Vario 160',2022,NULL),
	('ss_compat_012','ss_part_005','Honda','BeAT Street',2020,NULL),
	('ss_compat_013','ss_part_006','Yamaha','Mio M3 125',2018,NULL),
	('ss_compat_014','ss_part_006','Suzuki','NEX II',2018,NULL),
	('ss_compat_015','ss_part_007','Honda','Vario 125',2018,2024),
	('ss_compat_016','ss_part_008','Yamaha','NMAX 155',2020,NULL),
	('ss_compat_017','ss_part_008','Yamaha','Aerox 155',2020,NULL),
	('ss_compat_018','ss_part_009','Honda','BeAT Street',2020,NULL),
	('ss_compat_019','ss_part_009','Honda','Vario 125',2018,NULL),
	('ss_compat_020','ss_part_010','Yamaha','NMAX 155',2020,NULL),
	('ss_compat_021','ss_part_011','Honda','BeAT Street',2020,NULL),
	('ss_compat_022','ss_part_012','Yamaha','Aerox 155',2020,NULL),
	('ss_compat_023','ss_part_013','Honda','Vario 160',2022,NULL),
	('ss_compat_024','ss_part_014','Yamaha','NMAX 155',2020,NULL),
	('ss_compat_025','ss_part_018','Honda','Revo X',2017,NULL),
	('ss_compat_026','ss_part_019','Honda','Scoopy',2020,NULL),
	('ss_compat_027','ss_part_020','Honda','Scoopy',2020,NULL);

-- -----------------------------------------------------------------------------
-- Posted stock receipts and initial inventory history
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO stock_receipts
	(id,receipt_no,supplier_id,received_at,supplier_document_no,note,total_amount,status,idempotency_key,created_by,created_at) VALUES
	('ss_receipt_001','RCV-DEMO-001','ss_sup_001',datetime('now','-35 days'),'FK-DEMO-25001','Restock oli Federal, Motul, dan busi NGK',3287500,'posted','superseed:receipt:001','ATHTHAA',datetime('now','-35 days')),
	('ss_receipt_002','RCV-DEMO-002','ss_sup_002',datetime('now','-33 days'),'AO-DEMO-25018','Restock fast moving parts Honda',4074500,'posted','superseed:receipt:002','ATHTHAA',datetime('now','-33 days')),
	('ss_receipt_003','RCV-DEMO-003','ss_sup_003',datetime('now','-31 days'),'YGP-DEMO-25022','Restock fast moving parts Yamaha',4257000,'posted','superseed:receipt:003','ATHTHAA',datetime('now','-31 days')),
	('ss_receipt_004','RCV-DEMO-004','ss_sup_004',datetime('now','-29 days'),'ELC-DEMO-25009','Restock busi, aki, dan lampu',3517000,'posted','superseed:receipt:004','ATHTHAA',datetime('now','-29 days')),
	('ss_receipt_005','RCV-DEMO-005','ss_sup_006',datetime('now','-27 days'),'TYR-DEMO-25014','Restock fluida dan ban harian',5550000,'posted','superseed:receipt:005','ATHTHAA',datetime('now','-27 days'));

INSERT OR IGNORE INTO stock_receipt_items
	(id,stock_receipt_id,spare_part_id,quantity,unit_cost,subtotal) VALUES
	('ss_ri_001','ss_receipt_001','ss_part_001',25,47500,1187500),
	('ss_ri_002','ss_receipt_001','ss_part_004',18,95000,1710000),
	('ss_ri_003','ss_receipt_001','ss_part_005',20,19500,390000),
	('ss_ri_004','ss_receipt_002','ss_part_002',30,46500,1395000),
	('ss_ri_005','ss_receipt_002','ss_part_007',8,178000,1424000),
	('ss_ri_006','ss_receipt_002','ss_part_009',6,62000,372000),
	('ss_ri_007','ss_receipt_002','ss_part_013',12,38000,456000),
	('ss_ri_008','ss_receipt_002','ss_part_016',15,28500,427500),
	('ss_ri_009','ss_receipt_003','ss_part_003',24,52000,1248000),
	('ss_ri_010','ss_receipt_003','ss_part_008',7,245000,1715000),
	('ss_ri_011','ss_receipt_003','ss_part_010',8,68000,544000),
	('ss_ri_012','ss_receipt_003','ss_part_014',10,42000,420000),
	('ss_ri_013','ss_receipt_003','ss_part_017',20,16500,330000),
	('ss_ri_014','ss_receipt_004','ss_part_006',16,22000,352000),
	('ss_ri_015','ss_receipt_004','ss_part_011',6,235000,1410000),
	('ss_ri_016','ss_receipt_004','ss_part_012',5,255000,1275000),
	('ss_ri_017','ss_receipt_004','ss_part_018',15,32000,480000),
	('ss_ri_018','ss_receipt_005','ss_part_015',20,39000,780000),
	('ss_ri_019','ss_receipt_005','ss_part_019',6,385000,2310000),
	('ss_ri_020','ss_receipt_005','ss_part_020',6,410000,2460000);

INSERT OR IGNORE INTO inventory_movements
	(id,spare_part_id,type,reference_type,reference_id,delta,quantity_before,quantity_after,note,idempotency_key,created_by,created_at) VALUES
	('ss_mov_in_001','ss_part_001','stock_in','stock_receipt','ss_receipt_001',25,0,25,'Penerimaan stok awal showcase','superseed:movement:in:001','ATHTHAA',datetime('now','-35 days')),
	('ss_mov_in_002','ss_part_004','stock_in','stock_receipt','ss_receipt_001',18,0,18,'Penerimaan stok awal showcase','superseed:movement:in:002','ATHTHAA',datetime('now','-35 days')),
	('ss_mov_in_003','ss_part_005','stock_in','stock_receipt','ss_receipt_001',20,0,20,'Penerimaan stok awal showcase','superseed:movement:in:003','ATHTHAA',datetime('now','-35 days')),
	('ss_mov_in_004','ss_part_002','stock_in','stock_receipt','ss_receipt_002',30,0,30,'Penerimaan stok awal showcase','superseed:movement:in:004','ATHTHAA',datetime('now','-33 days')),
	('ss_mov_in_005','ss_part_007','stock_in','stock_receipt','ss_receipt_002',8,0,8,'Penerimaan stok awal showcase','superseed:movement:in:005','ATHTHAA',datetime('now','-33 days')),
	('ss_mov_in_006','ss_part_009','stock_in','stock_receipt','ss_receipt_002',6,0,6,'Penerimaan stok awal showcase','superseed:movement:in:006','ATHTHAA',datetime('now','-33 days')),
	('ss_mov_in_007','ss_part_013','stock_in','stock_receipt','ss_receipt_002',12,0,12,'Penerimaan stok awal showcase','superseed:movement:in:007','ATHTHAA',datetime('now','-33 days')),
	('ss_mov_in_008','ss_part_016','stock_in','stock_receipt','ss_receipt_002',15,0,15,'Penerimaan stok awal showcase','superseed:movement:in:008','ATHTHAA',datetime('now','-33 days')),
	('ss_mov_in_009','ss_part_003','stock_in','stock_receipt','ss_receipt_003',24,0,24,'Penerimaan stok awal showcase','superseed:movement:in:009','ATHTHAA',datetime('now','-31 days')),
	('ss_mov_in_010','ss_part_008','stock_in','stock_receipt','ss_receipt_003',7,0,7,'Penerimaan stok awal showcase','superseed:movement:in:010','ATHTHAA',datetime('now','-31 days')),
	('ss_mov_in_011','ss_part_010','stock_in','stock_receipt','ss_receipt_003',8,0,8,'Penerimaan stok awal showcase','superseed:movement:in:011','ATHTHAA',datetime('now','-31 days')),
	('ss_mov_in_012','ss_part_014','stock_in','stock_receipt','ss_receipt_003',10,0,10,'Penerimaan stok awal showcase','superseed:movement:in:012','ATHTHAA',datetime('now','-31 days')),
	('ss_mov_in_013','ss_part_017','stock_in','stock_receipt','ss_receipt_003',20,0,20,'Penerimaan stok awal showcase','superseed:movement:in:013','ATHTHAA',datetime('now','-31 days')),
	('ss_mov_in_014','ss_part_006','stock_in','stock_receipt','ss_receipt_004',16,0,16,'Penerimaan stok awal showcase','superseed:movement:in:014','ATHTHAA',datetime('now','-29 days')),
	('ss_mov_in_015','ss_part_011','stock_in','stock_receipt','ss_receipt_004',6,0,6,'Penerimaan stok awal showcase','superseed:movement:in:015','ATHTHAA',datetime('now','-29 days')),
	('ss_mov_in_016','ss_part_012','stock_in','stock_receipt','ss_receipt_004',5,0,5,'Penerimaan stok awal showcase','superseed:movement:in:016','ATHTHAA',datetime('now','-29 days')),
	('ss_mov_in_017','ss_part_018','stock_in','stock_receipt','ss_receipt_004',15,0,15,'Penerimaan stok awal showcase','superseed:movement:in:017','ATHTHAA',datetime('now','-29 days')),
	('ss_mov_in_018','ss_part_015','stock_in','stock_receipt','ss_receipt_005',20,0,20,'Penerimaan stok awal showcase','superseed:movement:in:018','ATHTHAA',datetime('now','-27 days')),
	('ss_mov_in_019','ss_part_019','stock_in','stock_receipt','ss_receipt_005',6,0,6,'Penerimaan stok awal showcase','superseed:movement:in:019','ATHTHAA',datetime('now','-27 days')),
	('ss_mov_in_020','ss_part_020','stock_in','stock_receipt','ss_receipt_005',6,0,6,'Penerimaan stok awal showcase','superseed:movement:in:020','ATHTHAA',datetime('now','-27 days'));

-- -----------------------------------------------------------------------------
-- Bookings: historical, active, upcoming, cancelled, and no-show
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO bookings
	(id,booking_no,customer_id,vehicle_id,scheduled_at,complaint,status,channel,idempotency_key,created_by,created_at) VALUES
	('ss_bkg_001','BK-DEMO-26001','ss_cus_001','ss_veh_001',datetime('now','-12 days','+8 hours'),'Tarikan awal bergetar, rem depan berbunyi, dan servis berkala.','checked_in','whatsapp','superseed:booking:001','ATHTHAA',datetime('now','-13 days')),
	('ss_bkg_002','BK-DEMO-26002','ss_cus_002','ss_veh_002',datetime('now','-9 days','+9 hours'),'Servis berkala 18.000 km dan pemeriksaan CVT.','checked_in','mobile','superseed:booking:002','ATHTHAA',datetime('now','-10 days')),
	('ss_bkg_003','BK-DEMO-26003','ss_cus_003','ss_veh_003',datetime('now','-8 hours'),'Lampu utama redup, rem kurang pakem, dan ganti oli.','checked_in','counter','superseed:booking:003','ATHTHAA',datetime('now','-1 day')),
	('ss_bkg_004','BK-DEMO-26004','ss_cus_004','ss_veh_004',datetime('now','-6 hours'),'Servis berkala, filter udara kotor, dan kuras minyak rem.','checked_in','whatsapp','superseed:booking:004','ATHTHAA',datetime('now','-2 days')),
	('ss_bkg_005','BK-DEMO-26005','ss_cus_005','ss_veh_005',datetime('now','-5 hours'),'Akselerasi tersendat dan suara CVT kasar.','checked_in','mobile','superseed:booking:005','ATHTHAA',datetime('now','-2 days')),
	('ss_bkg_006','BK-DEMO-26006','ss_cus_006','ss_veh_006',datetime('now','-4 hours'),'Starter kadang berat dan mesin brebet saat langsam.','checked_in','counter','superseed:booking:006','ATHTHAA',datetime('now','-1 day')),
	('ss_bkg_007','BK-DEMO-26007','ss_cus_007','ss_veh_007',datetime('now','-3 hours'),'Aki cepat tekor dan indikator kelistrikan tidak stabil.','checked_in','whatsapp','superseed:booking:007','ATHTHAA',datetime('now','-1 day')),
	('ss_bkg_008','BK-DEMO-26008','ss_cus_008','ss_veh_008',datetime('now','-2 hours'),'Bunyi mendecit dari CVT dan perlu pemeriksaan menyeluruh.','checked_in','counter','superseed:booking:008','ATHTHAA',datetime('now','-1 day')),
	('ss_bkg_009','BK-DEMO-26009','ss_cus_009','ss_veh_009',datetime('now','-1 hour'),'Servis rutin dan pengecekan tekanan ban.','checked_in','mobile','superseed:booking:009','ATHTHAA',datetime('now','-1 day')),
	('ss_bkg_010','BK-DEMO-26010','ss_cus_010','ss_veh_010',datetime('now','-6 days'),'Ban aus, mesin kurang responsif, dan servis rutin.','checked_in','counter','superseed:booking:010','ATHTHAA',datetime('now','-7 days')),
	('ss_bkg_011','BK-DEMO-26011','ss_cus_011','ss_veh_011',datetime('now','-4 days'),'Motor cepat panas dan rem depan terasa keras.','checked_in','whatsapp','superseed:booking:011','ATHTHAA',datetime('now','-5 days')),
	('ss_bkg_012','BK-DEMO-26012','ss_cus_012','ss_veh_012',datetime('now','-2 days'),'Servis besar 56.000 km dan lampu sering putus.','checked_in','counter','superseed:booking:012','ATHTHAA',datetime('now','-3 days')),
	('ss_bkg_013','BK-DEMO-26013','ss_cus_013','ss_veh_013',datetime('now','-10 hours'),'Servis berkala pertama dan pemeriksaan filter udara.','checked_in','mobile','superseed:booking:013','ATHTHAA',datetime('now','-2 days')),
	('ss_bkg_014','BK-DEMO-26014','ss_cus_014','ss_veh_014',datetime('now','-7 days'),'Pemeriksaan bunyi mesin setelah perjalanan luar kota.','checked_in','counter','superseed:booking:014','ATHTHAA',datetime('now','-8 days')),
	('ss_bkg_015','BK-DEMO-TODAY-01','ss_cus_003','ss_veh_003',datetime('now','+1 hour'),'Kontrol rem setelah penggantian kampas dan cek tekanan ban.','confirmed','whatsapp','superseed:booking:015','ATHTHAA',datetime('now','-3 hours')),
	('ss_bkg_016','BK-DEMO-TODAY-02','ss_cus_004','ss_veh_004',datetime('now','+2 hours'),'Ganti oli berkala dan pemeriksaan lampu sein.','scheduled','mobile','superseed:booking:016','ATHTHAA',datetime('now','-2 hours')),
	('ss_bkg_017','BK-DEMO-TODAY-03','ss_cus_005','ss_veh_005',datetime('now','+4 hours'),'Pengecekan CVT lanjutan setelah perjalanan jauh.','confirmed','whatsapp','superseed:booking:017','ATHTHAA',datetime('now','-90 minutes')),
	('ss_bkg_018','BK-DEMO-NEXT-01','ss_cus_009','ss_veh_009',datetime('now','+1 day','+9 hours'),'Servis berkala dan pembersihan throttle body.','scheduled','counter','superseed:booking:018','ATHTHAA',datetime('now','-1 hour')),
	('ss_bkg_019','BK-DEMO-CANCEL-01','ss_cus_010','ss_veh_010',datetime('now','-1 day'),'Rencana penggantian ban, dibatalkan pelanggan.','cancelled','whatsapp','superseed:booking:019','ATHTHAA',datetime('now','-3 days')),
	('ss_bkg_020','BK-DEMO-NOSHOW-01','ss_cus_012','ss_veh_012',datetime('now','-2 days'),'Pemeriksaan kelistrikan lanjutan.','no_show','mobile','superseed:booking:020','ATHTHAA',datetime('now','-4 days'));

-- -----------------------------------------------------------------------------
-- Service orders spanning the complete operational workflow
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO service_orders
	(id,order_no,booking_id,customer_id,vehicle_id,mechanic_id,complaint,inspection_notes,status,priority,estimated_completion,started_at,completed_at,created_by,created_at,updated_at) VALUES
	('ss_so_001','SO-DEMO-26001','ss_bkg_001','ss_cus_001','ss_veh_001','mech_rizky','Tarikan awal bergetar, rem depan berbunyi, dan servis berkala.','V-Belt mulai retak, kampas rem menipis, oli mesin pekat.','completed','high',datetime('now','-12 days','+14 hours'),datetime('now','-12 days','+8 hours'),datetime('now','-12 days','+13 hours'),'ATHTHAA',datetime('now','-12 days','+7 hours'),datetime('now','-12 days','+13 hours')),
	('ss_so_002','SO-DEMO-26002','ss_bkg_002','ss_cus_002','ss_veh_002','ss_mech_arif','Servis berkala 18.000 km dan pemeriksaan CVT.','Filter udara kotor, kampas rem depan 30 persen, oli gardan gelap.','completed','normal',datetime('now','-9 days','+15 hours'),datetime('now','-9 days','+9 hours'),datetime('now','-9 days','+14 hours'),'ATHTHAA',datetime('now','-9 days','+8 hours'),datetime('now','-9 days','+14 hours')),
	('ss_so_003','SO-DEMO-26003','ss_bkg_003','ss_cus_003','ss_veh_003','ss_mech_bayu','Lampu utama redup, rem kurang pakem, dan ganti oli.','Bohlam melemah, kampas rem aus, busi berkerak.','completed','high',datetime('now','-2 hours'),datetime('now','-8 hours'),datetime('now','-2 hours'),'ATHTHAA',datetime('now','-8 hours'),datetime('now','-2 hours')),
	('ss_so_004','SO-DEMO-26004','ss_bkg_004','ss_cus_004','ss_veh_004','ss_mech_eko','Servis berkala, filter udara kotor, dan kuras minyak rem.','Filter udara sangat kotor dan minyak rem keruh.','ready','normal',datetime('now','+30 minutes'),datetime('now','-6 hours'),NULL,'ATHTHAA',datetime('now','-6 hours'),datetime('now','-30 minutes')),
	('ss_so_005','SO-DEMO-26005','ss_bkg_005','ss_cus_005','ss_veh_005','mech_rizky','Akselerasi tersendat dan suara CVT kasar.','V-Belt aus, rumah CVT berdebu, filter udara perlu diganti.','quality_check','high',datetime('now','+1 hour'),datetime('now','-5 hours'),NULL,'ATHTHAA',datetime('now','-5 hours'),datetime('now','-20 minutes')),
	('ss_so_006','SO-DEMO-26006','ss_bkg_006','ss_cus_006','ss_veh_006','ss_mech_bayu','Starter kadang berat dan mesin brebet saat langsam.','Tegangan aki turun, busi lemah, injektor perlu dibersihkan.','in_progress','high',datetime('now','+2 hours'),datetime('now','-4 hours'),NULL,'ATHTHAA',datetime('now','-4 hours'),datetime('now','-15 minutes')),
	('ss_so_007','SO-DEMO-26007','ss_bkg_007','ss_cus_007','ss_veh_007','ss_mech_arif','Aki cepat tekor dan indikator kelistrikan tidak stabil.','Hasil charging normal; aki drop saat load test dan menunggu persetujuan penggantian.','approval','normal',datetime('now','+3 hours'),NULL,NULL,'ATHTHAA',datetime('now','-3 hours'),datetime('now','-25 minutes')),
	('ss_so_008','SO-DEMO-26008','ss_bkg_008','ss_cus_008','ss_veh_008','mech_rizky','Bunyi mendecit dari CVT dan perlu pemeriksaan menyeluruh.','Pemeriksaan awal menunjukkan debu CVT berlebih.','inspection','normal',datetime('now','+4 hours'),NULL,NULL,'ATHTHAA',datetime('now','-2 hours'),datetime('now','-10 minutes')),
	('ss_so_009','SO-DEMO-26009','ss_bkg_009','ss_cus_009','ss_veh_009',NULL,'Servis rutin dan pengecekan tekanan ban.',NULL,'waiting','low',datetime('now','+5 hours'),NULL,NULL,'ATHTHAA',datetime('now','-1 hour'),datetime('now','-1 hour')),
	('ss_so_010','SO-DEMO-26010','ss_bkg_010','ss_cus_010','ss_veh_010','ss_mech_satria','Ban aus, mesin kurang responsif, dan servis rutin.','Ban depan dan belakang aus merata; busi melemah.','completed','high',datetime('now','-6 days','+16 hours'),datetime('now','-6 days','+9 hours'),datetime('now','-6 days','+15 hours'),'ATHTHAA',datetime('now','-6 days','+8 hours'),datetime('now','-6 days','+15 hours')),
	('ss_so_011','SO-DEMO-26011','ss_bkg_011','ss_cus_011','ss_veh_011','ss_mech_eko','Motor cepat panas dan rem depan terasa keras.','Coolant berkurang, kampas rem mengeras, filter udara kotor.','completed','normal',datetime('now','-4 days','+15 hours'),datetime('now','-4 days','+9 hours'),datetime('now','-4 days','+14 hours'),'ATHTHAA',datetime('now','-4 days','+8 hours'),datetime('now','-4 days','+14 hours')),
	('ss_so_012','SO-DEMO-26012','ss_bkg_012','ss_cus_012','ss_veh_012','ss_mech_bayu','Servis besar 56.000 km dan lampu sering putus.','Busi berkerak, oli gardan gelap, konektor lampu longgar.','completed','normal',datetime('now','-2 days','+15 hours'),datetime('now','-2 days','+9 hours'),datetime('now','-2 days','+14 hours'),'ATHTHAA',datetime('now','-2 days','+8 hours'),datetime('now','-2 days','+14 hours')),
	('ss_so_013','SO-DEMO-26013','ss_bkg_013','ss_cus_013','ss_veh_013','ss_mech_eko','Servis berkala pertama dan pemeriksaan filter udara.','Oli mulai gelap dan filter udara berdebu.','completed','normal',datetime('now','-5 hours'),datetime('now','-10 hours'),datetime('now','-6 hours'),'ATHTHAA',datetime('now','-10 hours'),datetime('now','-6 hours')),
	('ss_so_014','SO-DEMO-26014','ss_bkg_014','ss_cus_014','ss_veh_014','ss_mech_arif','Pemeriksaan bunyi mesin setelah perjalanan luar kota.','Pelanggan menunda pembongkaran mesin dan mengambil kendaraan.','cancelled','normal',datetime('now','-7 days','+13 hours'),NULL,NULL,'ATHTHAA',datetime('now','-7 days','+9 hours'),datetime('now','-7 days','+11 hours'));

UPDATE bookings SET service_order_id='ss_so_001' WHERE id='ss_bkg_001' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_002' WHERE id='ss_bkg_002' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_003' WHERE id='ss_bkg_003' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_004' WHERE id='ss_bkg_004' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_005' WHERE id='ss_bkg_005' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_006' WHERE id='ss_bkg_006' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_007' WHERE id='ss_bkg_007' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_008' WHERE id='ss_bkg_008' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_009' WHERE id='ss_bkg_009' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_010' WHERE id='ss_bkg_010' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_011' WHERE id='ss_bkg_011' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_012' WHERE id='ss_bkg_012' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_013' WHERE id='ss_bkg_013' AND service_order_id IS NULL;
UPDATE bookings SET service_order_id='ss_so_014' WHERE id='ss_bkg_014' AND service_order_id IS NULL;

-- -----------------------------------------------------------------------------
-- Service tasks: completed history plus every active queue state
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO service_tasks
	(id,service_order_id,name,description,status,assigned_mechanic_id,completed_at,completed_by,created_at,updated_at) VALUES
	('ss_task_001','ss_so_001','Pemeriksaan awal','Periksa CVT, sistem rem, dan kondisi oli.','completed','mech_rizky',datetime('now','-12 days','+8 hours'),'MECH001',datetime('now','-12 days','+7 hours','+15 minutes'),datetime('now','-12 days','+8 hours')),
	('ss_task_002','ss_so_001','Servis CVT','Bersihkan ruang CVT dan ganti V-Belt.','completed','mech_rizky',datetime('now','-12 days','+10 hours'),'MECH001',datetime('now','-12 days','+8 hours'),datetime('now','-12 days','+10 hours')),
	('ss_task_003','ss_so_001','Penggantian kampas rem','Ganti kampas rem depan dan setel free play.','completed','mech_rizky',datetime('now','-12 days','+11 hours'),'MECH001',datetime('now','-12 days','+8 hours'),datetime('now','-12 days','+11 hours')),
	('ss_task_004','ss_so_001','Ganti oli dan uji jalan','Ganti oli mesin, inspeksi akhir, lalu uji jalan.','completed','mech_rizky',datetime('now','-12 days','+12 hours','+30 minutes'),'MECH001',datetime('now','-12 days','+8 hours'),datetime('now','-12 days','+12 hours','+30 minutes')),
	('ss_task_005','ss_so_002','Pemeriksaan 18.000 km','Pemeriksaan berkala sesuai kondisi kendaraan.','completed','ss_mech_arif',datetime('now','-9 days','+9 hours','+30 minutes'),'SS_MECH_ARIF',datetime('now','-9 days','+8 hours'),datetime('now','-9 days','+9 hours','+30 minutes')),
	('ss_task_006','ss_so_002','Servis CVT dan filter udara','Bersihkan CVT dan ganti filter udara.','completed','ss_mech_arif',datetime('now','-9 days','+11 hours'),'SS_MECH_ARIF',datetime('now','-9 days','+9 hours'),datetime('now','-9 days','+11 hours')),
	('ss_task_007','ss_so_002','Servis rem depan','Ganti kampas dan bersihkan kaliper.','completed','ss_mech_arif',datetime('now','-9 days','+12 hours'),'SS_MECH_ARIF',datetime('now','-9 days','+9 hours'),datetime('now','-9 days','+12 hours')),
	('ss_task_008','ss_so_002','Ganti fluida dan busi','Ganti oli mesin, oli gardan, dan busi.','completed','ss_mech_arif',datetime('now','-9 days','+13 hours'),'SS_MECH_ARIF',datetime('now','-9 days','+9 hours'),datetime('now','-9 days','+13 hours')),
	('ss_task_009','ss_so_003','Diagnosis lampu utama','Ukur tegangan dan periksa soket lampu.','completed','ss_mech_bayu',datetime('now','-7 hours'),'SS_MECH_BAYU',datetime('now','-8 hours'),datetime('now','-7 hours')),
	('ss_task_010','ss_so_003','Tune-up ringan','Ganti oli, busi, dan bersihkan throttle body.','completed','ss_mech_bayu',datetime('now','-5 hours'),'SS_MECH_BAYU',datetime('now','-7 hours'),datetime('now','-5 hours')),
	('ss_task_011','ss_so_003','Perbaikan rem dan lampu','Ganti kampas rem depan dan bohlam utama.','completed','ss_mech_bayu',datetime('now','-3 hours'),'SS_MECH_BAYU',datetime('now','-7 hours'),datetime('now','-3 hours')),
	('ss_task_012','ss_so_004','Servis berkala','Ganti oli dan periksa seluruh titik keselamatan.','completed','ss_mech_eko',datetime('now','-4 hours'),'SS_MECH_EKO',datetime('now','-6 hours'),datetime('now','-4 hours')),
	('ss_task_013','ss_so_004','Ganti filter udara','Bersihkan rumah filter dan pasang elemen baru.','completed','ss_mech_eko',datetime('now','-3 hours'),'SS_MECH_EKO',datetime('now','-5 hours'),datetime('now','-3 hours')),
	('ss_task_014','ss_so_004','Kuras minyak rem','Flushing minyak rem dan buang udara pada sistem.','completed','ss_mech_eko',datetime('now','-90 minutes'),'SS_MECH_EKO',datetime('now','-4 hours'),datetime('now','-90 minutes')),
	('ss_task_015','ss_so_004','Pemeriksaan akhir','Cek kebocoran dan kesiapan serah terima.','completed','ss_mech_eko',datetime('now','-45 minutes'),'SS_MECH_EKO',datetime('now','-2 hours'),datetime('now','-45 minutes')),
	('ss_task_016','ss_so_005','Bongkar dan bersihkan CVT','Bersihkan pulley, rumah CVT, dan kopling.','completed','mech_rizky',datetime('now','-3 hours'),'MECH001',datetime('now','-5 hours'),datetime('now','-3 hours')),
	('ss_task_017','ss_so_005','Ganti V-Belt','Pasang V-Belt baru dan ukur lebar drive belt.','completed','mech_rizky',datetime('now','-2 hours'),'MECH001',datetime('now','-4 hours'),datetime('now','-2 hours')),
	('ss_task_018','ss_so_005','Ganti oli dan filter udara','Lakukan servis fluida dan sistem pemasukan udara.','completed','mech_rizky',datetime('now','-1 hour'),'MECH001',datetime('now','-4 hours'),datetime('now','-1 hour')),
	('ss_task_019','ss_so_005','Quality control dan uji jalan','Pastikan akselerasi halus dan tidak ada bunyi abnormal.','in_progress','mech_rizky',NULL,NULL,datetime('now','-50 minutes'),datetime('now','-20 minutes')),
	('ss_task_020','ss_so_006','Load test aki','Ukur tegangan istirahat dan drop saat starter.','completed','ss_mech_bayu',datetime('now','-3 hours'),'SS_MECH_BAYU',datetime('now','-4 hours'),datetime('now','-3 hours')),
	('ss_task_021','ss_so_006','Ganti aki dan busi','Pasang aki serta busi baru lalu reset inspeksi.','completed','ss_mech_bayu',datetime('now','-2 hours'),'SS_MECH_BAYU',datetime('now','-3 hours'),datetime('now','-2 hours')),
	('ss_task_022','ss_so_006','Bersihkan injektor','Lakukan injector cleaning dan pemeriksaan pola semprot.','in_progress','ss_mech_bayu',NULL,NULL,datetime('now','-2 hours'),datetime('now','-15 minutes')),
	('ss_task_023','ss_so_006','Setel langsam dan uji emisi','Setel putaran idle setelah pembersihan injektor.','pending','ss_mech_bayu',NULL,NULL,datetime('now','-90 minutes'),datetime('now','-90 minutes')),
	('ss_task_024','ss_so_007','Diagnosis sistem pengisian','Periksa stator, kiprok, dan tegangan pengisian.','completed','ss_mech_arif',datetime('now','-2 hours'),'SS_MECH_ARIF',datetime('now','-3 hours'),datetime('now','-2 hours')),
	('ss_task_025','ss_so_007','Persetujuan penggantian aki','Hubungi pelanggan untuk persetujuan estimasi aki baru.','pending','ss_mech_arif',NULL,NULL,datetime('now','-2 hours'),datetime('now','-25 minutes')),
	('ss_task_026','ss_so_008','Inspeksi ruang CVT','Buka cover dan identifikasi sumber bunyi.','in_progress','mech_rizky',NULL,NULL,datetime('now','-2 hours'),datetime('now','-10 minutes')),
	('ss_task_027','ss_so_008','Pengukuran komponen CVT','Ukur V-Belt, roller, dan ketebalan kampas kopling.','pending','mech_rizky',NULL,NULL,datetime('now','-90 minutes'),datetime('now','-90 minutes')),
	('ss_task_028','ss_so_009','Penerimaan dan inspeksi visual','Catat kondisi kendaraan sebelum dikerjakan.','pending',NULL,NULL,NULL,datetime('now','-1 hour'),datetime('now','-1 hour')),
	('ss_task_029','ss_so_009','Servis berkala','Ganti oli dan lakukan pemeriksaan umum.','pending',NULL,NULL,NULL,datetime('now','-1 hour'),datetime('now','-1 hour')),
	('ss_task_030','ss_so_010','Ganti ban depan dan belakang','Pasang ban baru serta atur tekanan.','completed','ss_mech_satria',datetime('now','-6 days','+11 hours'),'SS_MECH_SATRIA',datetime('now','-6 days','+9 hours'),datetime('now','-6 days','+11 hours')),
	('ss_task_031','ss_so_010','Tune-up dan ganti busi','Ganti oli, busi, dan periksa pembakaran.','completed','ss_mech_satria',datetime('now','-6 days','+13 hours'),'SS_MECH_SATRIA',datetime('now','-6 days','+9 hours'),datetime('now','-6 days','+13 hours')),
	('ss_task_032','ss_so_010','Uji jalan','Pastikan handling dan respons mesin normal.','completed','ss_mech_satria',datetime('now','-6 days','+14 hours'),'SS_MECH_SATRIA',datetime('now','-6 days','+13 hours'),datetime('now','-6 days','+14 hours')),
	('ss_task_033','ss_so_011','Pemeriksaan sistem pendingin','Pressure test dan periksa jalur coolant.','completed','ss_mech_eko',datetime('now','-4 days','+10 hours'),'SS_MECH_EKO',datetime('now','-4 days','+9 hours'),datetime('now','-4 days','+10 hours')),
	('ss_task_034','ss_so_011','Servis rem depan','Ganti kampas rem dan bersihkan kaliper.','completed','ss_mech_eko',datetime('now','-4 days','+11 hours'),'SS_MECH_EKO',datetime('now','-4 days','+9 hours'),datetime('now','-4 days','+11 hours')),
	('ss_task_035','ss_so_011','Ganti oli, filter, dan coolant','Lakukan penggantian komponen servis berkala.','completed','ss_mech_eko',datetime('now','-4 days','+13 hours'),'SS_MECH_EKO',datetime('now','-4 days','+10 hours'),datetime('now','-4 days','+13 hours')),
	('ss_task_036','ss_so_012','Servis besar','Periksa rantai, klep, rem, dan seluruh fluida.','completed','ss_mech_bayu',datetime('now','-2 days','+11 hours'),'SS_MECH_BAYU',datetime('now','-2 days','+9 hours'),datetime('now','-2 days','+11 hours')),
	('ss_task_037','ss_so_012','Ganti oli, busi, dan oli gardan','Lakukan penggantian komponen berkala.','completed','ss_mech_bayu',datetime('now','-2 days','+12 hours'),'SS_MECH_BAYU',datetime('now','-2 days','+10 hours'),datetime('now','-2 days','+12 hours')),
	('ss_task_038','ss_so_012','Perbaikan konektor lampu','Kencangkan terminal dan lindungi dari kelembapan.','completed','ss_mech_bayu',datetime('now','-2 days','+13 hours'),'SS_MECH_BAYU',datetime('now','-2 days','+11 hours'),datetime('now','-2 days','+13 hours')),
	('ss_task_039','ss_so_013','Servis pertama','Ganti oli dan inspeksi baut serta sistem rem.','completed','ss_mech_eko',datetime('now','-8 hours'),'SS_MECH_EKO',datetime('now','-10 hours'),datetime('now','-8 hours')),
	('ss_task_040','ss_so_013','Ganti filter udara','Bersihkan boks filter dan pasang elemen baru.','completed','ss_mech_eko',datetime('now','-7 hours'),'SS_MECH_EKO',datetime('now','-9 hours'),datetime('now','-7 hours')),
	('ss_task_041','ss_so_013','Pemeriksaan akhir','Uji fungsi, scan singkat, dan serah terima.','completed','ss_mech_eko',datetime('now','-6 hours','-15 minutes'),'SS_MECH_EKO',datetime('now','-8 hours'),datetime('now','-6 hours','-15 minutes')),
	('ss_task_042','ss_so_014','Pemeriksaan bunyi mesin','Pembongkaran awal dibatalkan atas permintaan pelanggan.','cancelled','ss_mech_arif',NULL,NULL,datetime('now','-7 days','+9 hours'),datetime('now','-7 days','+11 hours'));

-- -----------------------------------------------------------------------------
-- Parts allocated/consumed by service orders
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO service_order_parts
	(id,service_order_id,spare_part_id,quantity,unit_price,status,created_at) VALUES
	('ss_sop_001','ss_so_001','ss_part_001',1,65000,'consumed',datetime('now','-12 days','+9 hours')),
	('ss_sop_002','ss_so_001','ss_part_007',1,235000,'consumed',datetime('now','-12 days','+9 hours')),
	('ss_sop_003','ss_so_001','ss_part_009',1,85000,'consumed',datetime('now','-12 days','+10 hours')),
	('ss_sop_004','ss_so_002','ss_part_003',1,75000,'consumed',datetime('now','-9 days','+10 hours')),
	('ss_sop_005','ss_so_002','ss_part_005',1,35000,'consumed',datetime('now','-9 days','+10 hours')),
	('ss_sop_006','ss_so_002','ss_part_010',1,92000,'consumed',datetime('now','-9 days','+11 hours')),
	('ss_sop_007','ss_so_002','ss_part_014',1,95000,'consumed',datetime('now','-9 days','+11 hours')),
	('ss_sop_008','ss_so_002','ss_part_017',1,25000,'consumed',datetime('now','-9 days','+12 hours')),
	('ss_sop_009','ss_so_003','ss_part_002',1,65000,'consumed',datetime('now','-6 hours')),
	('ss_sop_010','ss_so_003','ss_part_005',1,35000,'consumed',datetime('now','-6 hours')),
	('ss_sop_011','ss_so_003','ss_part_009',1,85000,'consumed',datetime('now','-4 hours')),
	('ss_sop_012','ss_so_003','ss_part_018',1,45000,'consumed',datetime('now','-4 hours')),
	('ss_sop_013','ss_so_004','ss_part_002',1,65000,'consumed',datetime('now','-4 hours')),
	('ss_sop_014','ss_so_004','ss_part_013',1,75000,'consumed',datetime('now','-3 hours')),
	('ss_sop_015','ss_so_004','ss_part_015',1,55000,'consumed',datetime('now','-2 hours')),
	('ss_sop_016','ss_so_005','ss_part_003',1,75000,'consumed',datetime('now','-3 hours')),
	('ss_sop_017','ss_so_005','ss_part_008',1,310000,'consumed',datetime('now','-2 hours')),
	('ss_sop_018','ss_so_005','ss_part_014',1,95000,'consumed',datetime('now','-1 hour')),
	('ss_sop_019','ss_so_006','ss_part_003',1,75000,'consumed',datetime('now','-2 hours')),
	('ss_sop_020','ss_so_006','ss_part_006',1,35000,'consumed',datetime('now','-2 hours')),
	('ss_sop_021','ss_so_006','ss_part_012',1,335000,'consumed',datetime('now','-2 hours')),
	('ss_sop_022','ss_so_007','ss_part_011',1,310000,'requested',datetime('now','-2 hours')),
	('ss_sop_023','ss_so_010','ss_part_004',1,135000,'consumed',datetime('now','-6 days','+10 hours')),
	('ss_sop_024','ss_so_010','ss_part_006',1,35000,'consumed',datetime('now','-6 days','+12 hours')),
	('ss_sop_025','ss_so_010','ss_part_019',1,525000,'consumed',datetime('now','-6 days','+10 hours')),
	('ss_sop_026','ss_so_010','ss_part_020',1,575000,'consumed',datetime('now','-6 days','+10 hours')),
	('ss_sop_027','ss_so_011','ss_part_004',1,135000,'consumed',datetime('now','-4 days','+12 hours')),
	('ss_sop_028','ss_so_011','ss_part_009',1,85000,'consumed',datetime('now','-4 days','+11 hours')),
	('ss_sop_029','ss_so_011','ss_part_013',1,75000,'consumed',datetime('now','-4 days','+12 hours')),
	('ss_sop_030','ss_so_011','ss_part_016',1,45000,'consumed',datetime('now','-4 days','+12 hours')),
	('ss_sop_031','ss_so_012','ss_part_002',1,65000,'consumed',datetime('now','-2 days','+11 hours')),
	('ss_sop_032','ss_so_012','ss_part_005',1,35000,'consumed',datetime('now','-2 days','+11 hours')),
	('ss_sop_033','ss_so_012','ss_part_017',1,25000,'consumed',datetime('now','-2 days','+12 hours')),
	('ss_sop_034','ss_so_013','ss_part_003',1,75000,'consumed',datetime('now','-8 hours')),
	('ss_sop_035','ss_so_013','ss_part_014',1,95000,'consumed',datetime('now','-7 hours'));

-- Each service-use movement mirrors the showcase stock levels above.
INSERT OR IGNORE INTO inventory_movements
	(id,spare_part_id,type,reference_type,reference_id,delta,quantity_before,quantity_after,note,idempotency_key,created_by,created_at) VALUES
	('ss_mov_use_001','ss_part_001','service_use','service_order','ss_so_001',-1,25,24,'Federal Ultratec untuk SO-DEMO-26001','superseed:movement:use:001','MECH001',datetime('now','-12 days','+9 hours')),
	('ss_mov_use_002','ss_part_007','service_use','service_order','ss_so_001',-1,8,7,'V-Belt Vario untuk SO-DEMO-26001','superseed:movement:use:002','MECH001',datetime('now','-12 days','+10 hours')),
	('ss_mov_use_003','ss_part_009','service_use','service_order','ss_so_001',-1,6,5,'Kampas rem Honda untuk SO-DEMO-26001','superseed:movement:use:003','MECH001',datetime('now','-12 days','+11 hours')),
	('ss_mov_use_004','ss_part_003','service_use','service_order','ss_so_002',-1,24,23,'Yamalube untuk SO-DEMO-26002','superseed:movement:use:004','SS_MECH_ARIF',datetime('now','-9 days','+10 hours')),
	('ss_mov_use_005','ss_part_005','service_use','service_order','ss_so_002',-1,20,19,'Busi NGK untuk SO-DEMO-26002','superseed:movement:use:005','SS_MECH_ARIF',datetime('now','-9 days','+10 hours')),
	('ss_mov_use_006','ss_part_010','service_use','service_order','ss_so_002',-1,8,7,'Kampas rem Yamaha untuk SO-DEMO-26002','superseed:movement:use:006','SS_MECH_ARIF',datetime('now','-9 days','+11 hours')),
	('ss_mov_use_007','ss_part_014','service_use','service_order','ss_so_002',-1,10,9,'Filter udara NMAX untuk SO-DEMO-26002','superseed:movement:use:007','SS_MECH_ARIF',datetime('now','-9 days','+11 hours')),
	('ss_mov_use_008','ss_part_017','service_use','service_order','ss_so_002',-1,20,19,'Oli gardan untuk SO-DEMO-26002','superseed:movement:use:008','SS_MECH_ARIF',datetime('now','-9 days','+12 hours')),
	('ss_mov_use_009','ss_part_002','service_use','service_order','ss_so_003',-1,29,28,'AHM MPX 2 untuk SO-DEMO-26003','superseed:movement:use:009','SS_MECH_BAYU',datetime('now','-6 hours')),
	('ss_mov_use_010','ss_part_005','service_use','service_order','ss_so_003',-1,18,17,'Busi NGK untuk SO-DEMO-26003','superseed:movement:use:010','SS_MECH_BAYU',datetime('now','-6 hours')),
	('ss_mov_use_011','ss_part_009','service_use','service_order','ss_so_003',-1,4,3,'Kampas rem Honda untuk SO-DEMO-26003','superseed:movement:use:011','SS_MECH_BAYU',datetime('now','-4 hours')),
	('ss_mov_use_012','ss_part_018','service_use','service_order','ss_so_003',-1,15,14,'Bohlam OSRAM untuk SO-DEMO-26003','superseed:movement:use:012','SS_MECH_BAYU',datetime('now','-4 hours')),
	('ss_mov_use_013','ss_part_002','service_use','service_order','ss_so_004',-1,28,27,'AHM MPX 2 untuk SO-DEMO-26004','superseed:movement:use:013','SS_MECH_EKO',datetime('now','-4 hours')),
	('ss_mov_use_014','ss_part_013','service_use','service_order','ss_so_004',-1,11,10,'Filter udara Vario untuk SO-DEMO-26004','superseed:movement:use:014','SS_MECH_EKO',datetime('now','-3 hours')),
	('ss_mov_use_015','ss_part_015','service_use','service_order','ss_so_004',-1,20,19,'Minyak rem untuk SO-DEMO-26004','superseed:movement:use:015','SS_MECH_EKO',datetime('now','-2 hours')),
	('ss_mov_use_016','ss_part_003','service_use','service_order','ss_so_005',-1,22,21,'Yamalube untuk SO-DEMO-26005','superseed:movement:use:016','MECH001',datetime('now','-3 hours')),
	('ss_mov_use_017','ss_part_008','service_use','service_order','ss_so_005',-1,7,6,'V-Belt Aerox untuk SO-DEMO-26005','superseed:movement:use:017','MECH001',datetime('now','-2 hours')),
	('ss_mov_use_018','ss_part_014','service_use','service_order','ss_so_005',-1,8,7,'Filter udara NMAX untuk SO-DEMO-26005','superseed:movement:use:018','MECH001',datetime('now','-1 hour')),
	('ss_mov_use_019','ss_part_003','service_use','service_order','ss_so_006',-1,21,20,'Yamalube untuk SO-DEMO-26006','superseed:movement:use:019','SS_MECH_BAYU',datetime('now','-2 hours')),
	('ss_mov_use_020','ss_part_006','service_use','service_order','ss_so_006',-1,15,14,'Busi Denso untuk SO-DEMO-26006','superseed:movement:use:020','SS_MECH_BAYU',datetime('now','-2 hours')),
	('ss_mov_use_021','ss_part_012','service_use','service_order','ss_so_006',-1,5,4,'Aki Yuasa untuk SO-DEMO-26006','superseed:movement:use:021','SS_MECH_BAYU',datetime('now','-2 hours')),
	('ss_mov_use_022','ss_part_004','service_use','service_order','ss_so_010',-1,18,17,'Motul Scooter LE untuk SO-DEMO-26010','superseed:movement:use:022','SS_MECH_SATRIA',datetime('now','-6 days','+10 hours')),
	('ss_mov_use_023','ss_part_006','service_use','service_order','ss_so_010',-1,16,15,'Busi Denso untuk SO-DEMO-26010','superseed:movement:use:023','SS_MECH_SATRIA',datetime('now','-6 days','+12 hours')),
	('ss_mov_use_024','ss_part_019','service_use','service_order','ss_so_010',-1,6,5,'Ban depan Michelin untuk SO-DEMO-26010','superseed:movement:use:024','SS_MECH_SATRIA',datetime('now','-6 days','+10 hours')),
	('ss_mov_use_025','ss_part_020','service_use','service_order','ss_so_010',-1,6,5,'Ban belakang Michelin untuk SO-DEMO-26010','superseed:movement:use:025','SS_MECH_SATRIA',datetime('now','-6 days','+10 hours')),
	('ss_mov_use_026','ss_part_004','service_use','service_order','ss_so_011',-1,17,16,'Motul Scooter LE untuk SO-DEMO-26011','superseed:movement:use:026','SS_MECH_EKO',datetime('now','-4 days','+12 hours')),
	('ss_mov_use_027','ss_part_009','service_use','service_order','ss_so_011',-1,5,4,'Kampas rem Honda untuk SO-DEMO-26011','superseed:movement:use:027','SS_MECH_EKO',datetime('now','-4 days','+11 hours')),
	('ss_mov_use_028','ss_part_013','service_use','service_order','ss_so_011',-1,12,11,'Filter udara Vario untuk SO-DEMO-26011','superseed:movement:use:028','SS_MECH_EKO',datetime('now','-4 days','+12 hours')),
	('ss_mov_use_029','ss_part_016','service_use','service_order','ss_so_011',-1,15,14,'Coolant AHM untuk SO-DEMO-26011','superseed:movement:use:029','SS_MECH_EKO',datetime('now','-4 days','+12 hours')),
	('ss_mov_use_030','ss_part_002','service_use','service_order','ss_so_012',-1,30,29,'AHM MPX 2 untuk SO-DEMO-26012','superseed:movement:use:030','SS_MECH_BAYU',datetime('now','-2 days','+11 hours')),
	('ss_mov_use_031','ss_part_005','service_use','service_order','ss_so_012',-1,19,18,'Busi NGK untuk SO-DEMO-26012','superseed:movement:use:031','SS_MECH_BAYU',datetime('now','-2 days','+11 hours')),
	('ss_mov_use_032','ss_part_017','service_use','service_order','ss_so_012',-1,19,18,'Oli gardan untuk SO-DEMO-26012','superseed:movement:use:032','SS_MECH_BAYU',datetime('now','-2 days','+12 hours')),
	('ss_mov_use_033','ss_part_003','service_use','service_order','ss_so_013',-1,23,22,'Yamalube untuk SO-DEMO-26013','superseed:movement:use:033','SS_MECH_EKO',datetime('now','-8 hours')),
	('ss_mov_use_034','ss_part_014','service_use','service_order','ss_so_013',-1,9,8,'Filter udara NMAX untuk SO-DEMO-26013','superseed:movement:use:034','SS_MECH_EKO',datetime('now','-7 hours'));

-- -----------------------------------------------------------------------------
-- Invoices and realistic payment histories
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO invoices
	(id,invoice_no,service_order_id,subtotal,discount,tax,total,status,paid_at,created_at,updated_at) VALUES
	('ss_inv_001','INV-DEMO-26001','ss_so_001',565000,15000,0,550000,'paid',datetime('now','-12 days','+13 hours'),datetime('now','-12 days','+12 hours','+40 minutes'),datetime('now','-12 days','+13 hours')),
	('ss_inv_002','INV-DEMO-26002','ss_so_002',480000,0,0,480000,'paid',datetime('now','-9 days','+14 hours'),datetime('now','-9 days','+13 hours','+10 minutes'),datetime('now','-9 days','+14 hours')),
	('ss_inv_003','INV-DEMO-26003','ss_so_003',400000,20000,0,380000,'paid',datetime('now','-2 hours'),datetime('now','-3 hours'),datetime('now','-2 hours')),
	('ss_inv_004','INV-DEMO-26004','ss_so_004',325000,0,0,325000,'unpaid',NULL,datetime('now','-45 minutes'),datetime('now','-45 minutes')),
	('ss_inv_005','INV-DEMO-26005','ss_so_005',680000,0,0,680000,'unpaid',NULL,datetime('now','-1 hour'),datetime('now','-20 minutes')),
	('ss_inv_006','INV-DEMO-26010','ss_so_010',1500000,0,0,1500000,'paid',datetime('now','-6 days','+15 hours'),datetime('now','-6 days','+14 hours','+10 minutes'),datetime('now','-6 days','+15 hours')),
	('ss_inv_007','INV-DEMO-26011','ss_so_011',500000,0,0,500000,'paid',datetime('now','-4 days','+14 hours'),datetime('now','-4 days','+13 hours','+10 minutes'),datetime('now','-4 days','+14 hours')),
	('ss_inv_008','INV-DEMO-26012','ss_so_012',250000,0,0,250000,'paid',datetime('now','-2 days','+14 hours'),datetime('now','-2 days','+13 hours','+10 minutes'),datetime('now','-2 days','+14 hours')),
	('ss_inv_009','INV-DEMO-26013','ss_so_013',350000,0,0,350000,'paid',datetime('now','-6 hours'),datetime('now','-6 hours','-10 minutes'),datetime('now','-6 hours'));

INSERT OR IGNORE INTO payments
	(id,payment_no,invoice_id,method,amount,cash_received,change_amount,status,provider_reference,idempotency_key,processed_by,created_at,updated_at) VALUES
	('ss_pay_001','PAY-DEMO-26001','ss_inv_001','cash',550000,600000,50000,'paid',NULL,'superseed:payment:001','CASH001',datetime('now','-12 days','+13 hours'),datetime('now','-12 days','+13 hours')),
	('ss_pay_002','PAY-DEMO-26002','ss_inv_002','cash',480000,500000,20000,'paid',NULL,'superseed:payment:002','CASH001',datetime('now','-9 days','+14 hours'),datetime('now','-9 days','+14 hours')),
	('ss_pay_003','PAY-DEMO-26003','ss_inv_003','cash',380000,400000,20000,'paid',NULL,'superseed:payment:003','CASH001',datetime('now','-2 hours'),datetime('now','-2 hours')),
	('ss_pay_004','PAY-DEMO-26010','ss_inv_006','cash',1500000,1500000,0,'paid',NULL,'superseed:payment:004','CASH001',datetime('now','-6 days','+15 hours'),datetime('now','-6 days','+15 hours')),
	('ss_pay_005','PAY-DEMO-26011','ss_inv_007','cash',500000,500000,0,'paid',NULL,'superseed:payment:005','CASH001',datetime('now','-4 days','+14 hours'),datetime('now','-4 days','+14 hours')),
	('ss_pay_006','PAY-DEMO-26012','ss_inv_008','cash',250000,300000,50000,'paid',NULL,'superseed:payment:006','CASH001',datetime('now','-2 days','+14 hours'),datetime('now','-2 days','+14 hours')),
	('ss_pay_007','PAY-DEMO-26013','ss_inv_009','cash',350000,350000,0,'paid',NULL,'superseed:payment:007','CASH001',datetime('now','-6 hours'),datetime('now','-6 hours')),
	('ss_pay_008','PAY-DEMO-QRIS-01','ss_inv_005','qris',680000,NULL,NULL,'expired','DEMO-QRIS-EXPIRED-26005','superseed:payment:008','CASH001',datetime('now','-55 minutes'),datetime('now','-25 minutes')),
	('ss_pay_009','PAY-DEMO-TRF-01','ss_inv_004','transfer',325000,NULL,NULL,'failed','DEMO-TRANSFER-FAILED-26004','superseed:payment:009','CASH001',datetime('now','-35 minutes'),datetime('now','-30 minutes'));

-- -----------------------------------------------------------------------------
-- Service timelines used by detail views
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO service_activities
	(id,service_order_id,event_type,description,user_id,metadata_json,created_at) VALUES
	('ss_act_001','ss_so_001','service_created','Service order dibuat dari booking pelanggan.','ATHTHAA','{"from":"booking","status":"waiting"}',datetime('now','-12 days','+7 hours')),
	('ss_act_002','ss_so_001','mechanic_assigned','Rizky Maulana ditugaskan menangani kendaraan.','ATHTHAA','{"mechanic_id":"mech_rizky"}',datetime('now','-12 days','+7 hours','+10 minutes')),
	('ss_act_003','ss_so_001','inspection_completed','Inspeksi menemukan V-Belt retak dan kampas rem menipis.','MECH001','{"priority":"high"}',datetime('now','-12 days','+8 hours')),
	('ss_act_004','ss_so_001','parts_consumed','Tiga jenis suku cadang dipakai untuk pekerjaan servis.','MECH001','{"part_lines":3}',datetime('now','-12 days','+11 hours')),
	('ss_act_005','ss_so_001','service_completed','Pekerjaan selesai dan kendaraan lulus uji jalan.','MECH001','{"status":"completed"}',datetime('now','-12 days','+13 hours')),
	('ss_act_006','ss_so_002','service_created','Service order servis berkala dibuat.','ATHTHAA','{"from":"booking"}',datetime('now','-9 days','+8 hours')),
	('ss_act_007','ss_so_002','inspection_completed','Filter udara dan oli gardan direkomendasikan diganti.','SS_MECH_ARIF','{"status":"inspection"}',datetime('now','-9 days','+9 hours','+30 minutes')),
	('ss_act_008','ss_so_002','service_completed','Seluruh pekerjaan servis berkala selesai.','SS_MECH_ARIF','{"status":"completed"}',datetime('now','-9 days','+14 hours')),
	('ss_act_009','ss_so_003','service_created','Kendaraan diterima untuk keluhan rem dan lampu.','ATHTHAA','{"priority":"high"}',datetime('now','-8 hours')),
	('ss_act_010','ss_so_003','inspection_completed','Diagnosis lampu, busi, dan rem selesai.','SS_MECH_BAYU','{"status":"inspection"}',datetime('now','-7 hours')),
	('ss_act_011','ss_so_003','service_completed','Kendaraan selesai diservis dan siap diserahkan.','SS_MECH_BAYU','{"status":"completed"}',datetime('now','-2 hours')),
	('ss_act_012','ss_so_004','service_created','Service order dibuat dari kedatangan booking.','ATHTHAA','{"from":"booking"}',datetime('now','-6 hours')),
	('ss_act_013','ss_so_004','service_started','Eko Prasetyo memulai servis berkala.','SS_MECH_EKO','{"status":"in_progress"}',datetime('now','-5 hours','-30 minutes')),
	('ss_act_014','ss_so_004','quality_check_passed','Pemeriksaan akhir selesai tanpa kebocoran.','SS_MECH_EKO','{"status":"ready"}',datetime('now','-45 minutes')),
	('ss_act_015','ss_so_004','customer_notified','Pelanggan diberi tahu kendaraan siap diambil.','CASH001','{"channel":"whatsapp","delivery":"demo"}',datetime('now','-30 minutes')),
	('ss_act_016','ss_so_005','service_created','Service order keluhan CVT dibuat.','ATHTHAA','{"priority":"high"}',datetime('now','-5 hours')),
	('ss_act_017','ss_so_005','service_started','Pembongkaran dan pembersihan CVT dimulai.','MECH001','{"status":"in_progress"}',datetime('now','-4 hours','-30 minutes')),
	('ss_act_018','ss_so_005','parts_consumed','V-Belt, oli, dan filter udara telah dipasang.','MECH001','{"part_lines":3}',datetime('now','-1 hour')),
	('ss_act_019','ss_so_005','quality_check_started','Kendaraan memasuki tahap quality control.','MECH001','{"status":"quality_check"}',datetime('now','-50 minutes')),
	('ss_act_020','ss_so_006','service_created','Service order kelistrikan dan brebet dibuat.','ATHTHAA','{"priority":"high"}',datetime('now','-4 hours')),
	('ss_act_021','ss_so_006','inspection_completed','Aki dan busi dinyatakan perlu diganti.','SS_MECH_BAYU','{"status":"inspection"}',datetime('now','-3 hours')),
	('ss_act_022','ss_so_006','service_started','Penggantian komponen dan pembersihan injektor dimulai.','SS_MECH_BAYU','{"status":"in_progress"}',datetime('now','-2 hours','-30 minutes')),
	('ss_act_023','ss_so_007','service_created','Kendaraan masuk untuk diagnosis kelistrikan.','ATHTHAA','{"from":"booking"}',datetime('now','-3 hours')),
	('ss_act_024','ss_so_007','approval_requested','Persetujuan penggantian aki diminta kepada pelanggan.','SS_MECH_ARIF','{"estimate":310000,"status":"approval"}',datetime('now','-2 hours')),
	('ss_act_025','ss_so_008','service_created','Pemeriksaan bunyi CVT dijadwalkan.','ATHTHAA','{"from":"booking"}',datetime('now','-2 hours')),
	('ss_act_026','ss_so_008','inspection_started','Cover CVT dibuka untuk inspeksi detail.','MECH001','{"status":"inspection"}',datetime('now','-90 minutes')),
	('ss_act_027','ss_so_009','service_created','Kendaraan berada dalam antrean penerimaan.','ATHTHAA','{"status":"waiting"}',datetime('now','-1 hour')),
	('ss_act_028','ss_so_010','service_created','Service order ban dan tune-up dibuat.','ATHTHAA','{"priority":"high"}',datetime('now','-6 days','+8 hours')),
	('ss_act_029','ss_so_010','parts_consumed','Dua ban, oli, dan busi telah dipasang.','SS_MECH_SATRIA','{"part_lines":4}',datetime('now','-6 days','+12 hours')),
	('ss_act_030','ss_so_010','service_completed','Kendaraan lulus uji jalan setelah penggantian ban.','SS_MECH_SATRIA','{"status":"completed"}',datetime('now','-6 days','+15 hours')),
	('ss_act_031','ss_so_011','service_created','Service order sistem pendingin dibuat.','ATHTHAA','{"from":"booking"}',datetime('now','-4 days','+8 hours')),
	('ss_act_032','ss_so_011','inspection_completed','Coolant, kampas rem, dan filter udara perlu diganti.','SS_MECH_EKO','{"status":"inspection"}',datetime('now','-4 days','+10 hours')),
	('ss_act_033','ss_so_011','service_completed','Servis selesai dan suhu kerja kembali normal.','SS_MECH_EKO','{"status":"completed"}',datetime('now','-4 days','+14 hours')),
	('ss_act_034','ss_so_012','service_created','Service order servis besar dibuat.','ATHTHAA','{"from":"booking"}',datetime('now','-2 days','+8 hours')),
	('ss_act_035','ss_so_012','service_completed','Servis besar dan perbaikan konektor selesai.','SS_MECH_BAYU','{"status":"completed"}',datetime('now','-2 days','+14 hours')),
	('ss_act_036','ss_so_013','service_created','Service order servis pertama dibuat.','ATHTHAA','{"from":"booking"}',datetime('now','-10 hours')),
	('ss_act_037','ss_so_013','service_completed','Servis pertama selesai dan kendaraan diserahkan.','SS_MECH_EKO','{"status":"completed"}',datetime('now','-6 hours')),
	('ss_act_038','ss_so_014','service_created','Pemeriksaan bunyi mesin dibuat dari booking.','ATHTHAA','{"from":"booking"}',datetime('now','-7 days','+9 hours')),
	('ss_act_039','ss_so_014','service_cancelled','Pelanggan menunda pembongkaran mesin.','SS_MECH_ARIF','{"status":"cancelled","reason":"customer_request"}',datetime('now','-7 days','+11 hours'));

-- -----------------------------------------------------------------------------
-- Operational notifications for admin, cashier, and mechanics
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO notifications
	(id,user_id,role_key,type,title,message,severity,action_url,read_at,created_at) VALUES
	('ss_notif_001','ATHTHAA',NULL,'booking','Booking baru hari ini','Booking BK-DEMO-TODAY-04 menunggu konfirmasi jadwal.','info','/bookings/ss_bkg_018',NULL,datetime('now','-25 minutes')),
	('ss_notif_002','ATHTHAA',NULL,'service','Antrean belum ditugaskan','SO-DEMO-26009 belum memiliki mekanik.','warning','/services/ss_so_009',NULL,datetime('now','-50 minutes')),
	('ss_notif_003','CASH001',NULL,'ready','Kendaraan siap diserahkan','SO-DEMO-26004 siap diambil; invoice masih belum dibayar.','success','/services/ss_so_004',NULL,datetime('now','-30 minutes')),
	('ss_notif_004','CASH001',NULL,'payment','Pembayaran QRIS kedaluwarsa','Percobaan QRIS untuk INV-DEMO-26005 telah kedaluwarsa.','warning','/payments/ss_pay_008',NULL,datetime('now','-25 minutes')),
	('ss_notif_005','MECH001',NULL,'task','Quality control aktif','Selesaikan uji jalan SO-DEMO-26005.','warning','/services/ss_so_005',NULL,datetime('now','-20 minutes')),
	('ss_notif_006','SS_MECH_BAYU',NULL,'task','Pekerjaan sedang berjalan','Pembersihan injektor SO-DEMO-26006 belum selesai.','info','/services/ss_so_006',NULL,datetime('now','-15 minutes')),
	('ss_notif_007','SS_MECH_ARIF',NULL,'approval','Menunggu persetujuan pelanggan','Penggantian aki SO-DEMO-26007 menunggu jawaban pelanggan.','warning','/services/ss_so_007',NULL,datetime('now','-25 minutes')),
	('ss_notif_008',NULL,'admin','inventory','Stok V-Belt di bawah minimum','Honda Genuine Parts V-Belt Vario 125/150 tersisa 7 unit.','critical','/inventory/ss_part_007',NULL,datetime('now','-40 minutes')),
	('ss_notif_009',NULL,'admin','inventory','Stok kampas rem kritis','Honda Genuine Parts Front Brake Pad tersisa 3 set.','critical','/inventory/ss_part_009',NULL,datetime('now','-35 minutes')),
	('ss_notif_010',NULL,'cashier','invoice','Invoice belum dibayar','INV-DEMO-26004 senilai Rp325.000 belum dibayar.','warning','/payments?invoice=ss_inv_004',NULL,datetime('now','-30 minutes')),
	('ss_notif_011',NULL,'cashier','invoice','Invoice belum dibayar','INV-DEMO-26005 senilai Rp680.000 belum dibayar.','warning','/payments?invoice=ss_inv_005',NULL,datetime('now','-20 minutes')),
	('ss_notif_012','ATHTHAA',NULL,'report','Target transaksi demo tercapai','Tujuh pembayaran tunai berhasil tercatat pada dataset pameran.','success','/reports',datetime('now','-1 hour'),datetime('now','-6 hours')),
	('ss_notif_013','SS_MECH_EKO',NULL,'service','Pekerjaan selesai','SO-DEMO-26013 telah selesai dan dibayar.','success','/services/ss_so_013',datetime('now','-5 hours'),datetime('now','-6 hours')),
	('ss_notif_014','SS_MECH_SATRIA',NULL,'schedule','Jadwal kerja selesai','Tidak ada antrean tambahan setelah SO-DEMO-26010.','info','/dashboard',datetime('now','-5 days'),datetime('now','-6 days')),
	('ss_notif_015',NULL,'mechanic','booking','Booking besok tersedia','Tiga booking terkonfirmasi untuk hari berikutnya.','info','/bookings',NULL,datetime('now','-10 minutes'));

-- -----------------------------------------------------------------------------
-- Audit stream used by activity and reporting pages
-- -----------------------------------------------------------------------------

INSERT OR IGNORE INTO audit_events
	(id,event_type,severity,service_key,user_id,session_id,request_id,ip_hash,user_agent_hash,target_type,target_id,outcome,reason_code,metadata_json,created_at) VALUES
	('ss_audit_001','stock_receipt_created','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-001',NULL,NULL,'stock_receipt','ss_receipt_001','success',NULL,'{"receipt_no":"RCV-DEMO-001","total_amount":3287500}',datetime('now','-35 days')),
	('ss_audit_002','stock_receipt_created','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-002',NULL,NULL,'stock_receipt','ss_receipt_002','success',NULL,'{"receipt_no":"RCV-DEMO-002","total_amount":4074500}',datetime('now','-33 days')),
	('ss_audit_003','stock_receipt_created','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-003',NULL,NULL,'stock_receipt','ss_receipt_003','success',NULL,'{"receipt_no":"RCV-DEMO-003","total_amount":4257000}',datetime('now','-31 days')),
	('ss_audit_004','booking_checked_in','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-004',NULL,NULL,'booking','ss_bkg_001','success',NULL,'{"booking_no":"BK-DEMO-26001"}',datetime('now','-12 days','+7 hours')),
	('ss_audit_005','service_mechanic_assigned','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-005',NULL,NULL,'service_order','ss_so_001','success',NULL,'{"mechanic":"Rizky Maulana"}',datetime('now','-12 days','+7 hours','+10 minutes')),
	('ss_audit_006','service_part_consumed','info','irwanmotor-app','MECH001',NULL,'ss-req-006',NULL,NULL,'service_order','ss_so_001','success',NULL,'{"part_lines":3}',datetime('now','-12 days','+11 hours')),
	('ss_audit_007','service_status_changed','info','irwanmotor-app','MECH001',NULL,'ss-req-007',NULL,NULL,'service_order','ss_so_001','success',NULL,'{"from":"quality_check","to":"completed"}',datetime('now','-12 days','+13 hours')),
	('ss_audit_008','invoice_created','info','irwanmotor-app','CASH001',NULL,'ss-req-008',NULL,NULL,'invoice','ss_inv_001','success',NULL,'{"invoice_no":"INV-DEMO-26001","total":550000}',datetime('now','-12 days','+12 hours','+40 minutes')),
	('ss_audit_009','payment_processed','info','irwanmotor-app','CASH001',NULL,'ss-req-009',NULL,NULL,'payment','ss_pay_001','success',NULL,'{"method":"cash","amount":550000}',datetime('now','-12 days','+13 hours')),
	('ss_audit_010','booking_checked_in','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-010',NULL,NULL,'booking','ss_bkg_002','success',NULL,'{"booking_no":"BK-DEMO-26002"}',datetime('now','-9 days','+8 hours')),
	('ss_audit_011','service_task_completed','info','irwanmotor-app','SS_MECH_ARIF',NULL,'ss-req-011',NULL,NULL,'service_task','ss_task_008','success',NULL,'{"service_order_id":"ss_so_002"}',datetime('now','-9 days','+13 hours')),
	('ss_audit_012','payment_processed','info','irwanmotor-app','CASH001',NULL,'ss-req-012',NULL,NULL,'payment','ss_pay_002','success',NULL,'{"method":"cash","amount":480000}',datetime('now','-9 days','+14 hours')),
	('ss_audit_013','booking_checked_in','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-013',NULL,NULL,'booking','ss_bkg_010','success',NULL,'{"booking_no":"BK-DEMO-26010"}',datetime('now','-6 days','+8 hours')),
	('ss_audit_014','service_part_consumed','info','irwanmotor-app','SS_MECH_SATRIA',NULL,'ss-req-014',NULL,NULL,'service_order','ss_so_010','success',NULL,'{"part_lines":4}',datetime('now','-6 days','+12 hours')),
	('ss_audit_015','payment_processed','info','irwanmotor-app','CASH001',NULL,'ss-req-015',NULL,NULL,'payment','ss_pay_004','success',NULL,'{"method":"cash","amount":1500000}',datetime('now','-6 days','+15 hours')),
	('ss_audit_016','service_status_changed','info','irwanmotor-app','SS_MECH_EKO',NULL,'ss-req-016',NULL,NULL,'service_order','ss_so_011','success',NULL,'{"from":"quality_check","to":"completed"}',datetime('now','-4 days','+14 hours')),
	('ss_audit_017','payment_processed','info','irwanmotor-app','CASH001',NULL,'ss-req-017',NULL,NULL,'payment','ss_pay_005','success',NULL,'{"method":"cash","amount":500000}',datetime('now','-4 days','+14 hours')),
	('ss_audit_018','service_task_completed','info','irwanmotor-app','SS_MECH_BAYU',NULL,'ss-req-018',NULL,NULL,'service_task','ss_task_038','success',NULL,'{"service_order_id":"ss_so_012"}',datetime('now','-2 days','+13 hours')),
	('ss_audit_019','payment_processed','info','irwanmotor-app','CASH001',NULL,'ss-req-019',NULL,NULL,'payment','ss_pay_006','success',NULL,'{"method":"cash","amount":250000}',datetime('now','-2 days','+14 hours')),
	('ss_audit_020','booking_checked_in','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-020',NULL,NULL,'booking','ss_bkg_003','success',NULL,'{"booking_no":"BK-DEMO-TODAY-01"}',datetime('now','-8 hours')),
	('ss_audit_021','service_status_changed','info','irwanmotor-app','SS_MECH_BAYU',NULL,'ss-req-021',NULL,NULL,'service_order','ss_so_003','success',NULL,'{"from":"quality_check","to":"completed"}',datetime('now','-2 hours')),
	('ss_audit_022','payment_processed','info','irwanmotor-app','CASH001',NULL,'ss-req-022',NULL,NULL,'payment','ss_pay_003','success',NULL,'{"method":"cash","amount":380000}',datetime('now','-2 hours')),
	('ss_audit_023','service_status_changed','info','irwanmotor-app','SS_MECH_EKO',NULL,'ss-req-023',NULL,NULL,'service_order','ss_so_004','success',NULL,'{"from":"quality_check","to":"ready"}',datetime('now','-45 minutes')),
	('ss_audit_024','payment_processed','warning','irwanmotor-app','CASH001',NULL,'ss-req-024',NULL,NULL,'payment','ss_pay_009','failed','provider_rejected_demo','{"method":"transfer","amount":325000}',datetime('now','-30 minutes')),
	('ss_audit_025','service_status_changed','info','irwanmotor-app','MECH001',NULL,'ss-req-025',NULL,NULL,'service_order','ss_so_005','success',NULL,'{"from":"in_progress","to":"quality_check"}',datetime('now','-50 minutes')),
	('ss_audit_026','payment_processed','warning','irwanmotor-app','CASH001',NULL,'ss-req-026',NULL,NULL,'payment','ss_pay_008','failed','expired_demo','{"method":"qris","amount":680000}',datetime('now','-25 minutes')),
	('ss_audit_027','service_status_changed','info','irwanmotor-app','SS_MECH_BAYU',NULL,'ss-req-027',NULL,NULL,'service_order','ss_so_006','success',NULL,'{"from":"inspection","to":"in_progress"}',datetime('now','-2 hours','-30 minutes')),
	('ss_audit_028','service_status_changed','info','irwanmotor-app','SS_MECH_ARIF',NULL,'ss-req-028',NULL,NULL,'service_order','ss_so_007','success',NULL,'{"from":"inspection","to":"approval"}',datetime('now','-2 hours')),
	('ss_audit_029','booking_created','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-029',NULL,NULL,'booking','ss_bkg_018','success',NULL,'{"booking_no":"BK-DEMO-TODAY-04","source":"whatsapp"}',datetime('now','-25 minutes')),
	('ss_audit_030','inventory_adjusted','warning','irwanmotor-app','ATHTHAA',NULL,'ss-req-030',NULL,NULL,'spare_part','ss_part_009','success',NULL,'{"stock":3,"minimum_stock":8}',datetime('now','-35 minutes')),
	('ss_audit_031','invoice_created','info','irwanmotor-app','CASH001',NULL,'ss-req-031',NULL,NULL,'invoice','ss_inv_004','success',NULL,'{"invoice_no":"INV-DEMO-26004","total":325000}',datetime('now','-45 minutes')),
	('ss_audit_032','service_task_created','info','irwanmotor-app','ATHTHAA',NULL,'ss-req-032',NULL,NULL,'service_task','ss_task_028','success',NULL,'{"service_order_id":"ss_so_009","status":"pending"}',datetime('now','-1 hour'));

-- -----------------------------------------------------------------------------
-- Compact verification output when executed with Wrangler
-- -----------------------------------------------------------------------------

SELECT
	(SELECT COUNT(*) FROM customers WHERE id LIKE 'ss_cus_%') AS customers,
	(SELECT COUNT(*) FROM vehicles WHERE id LIKE 'ss_veh_%') AS vehicles,
	(SELECT COUNT(*) FROM bookings WHERE id LIKE 'ss_bkg_%') AS bookings,
	(SELECT COUNT(*) FROM service_orders WHERE id LIKE 'ss_so_%') AS service_orders,
	(SELECT COUNT(*) FROM service_tasks WHERE id LIKE 'ss_task_%') AS service_tasks,
	(SELECT COUNT(*) FROM spare_parts WHERE id LIKE 'ss_part_%') AS spare_parts,
	(SELECT COUNT(*) FROM service_order_parts WHERE id LIKE 'ss_sop_%') AS part_usage,
	(SELECT COUNT(*) FROM invoices WHERE id LIKE 'ss_inv_%') AS invoices,
	(SELECT COUNT(*) FROM payments WHERE id LIKE 'ss_pay_%') AS payments,
	(SELECT COUNT(*) FROM notifications WHERE id LIKE 'ss_notif_%') AS notifications,
	(SELECT COUNT(*) FROM audit_events WHERE id LIKE 'ss_audit_%') AS audit_events;
