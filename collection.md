# Irwan Motor Auth API Collection

Collection curl siap copy-paste untuk GitHub. Base URL langsung memakai production Worker:

```text
https://bengkel.irwanmotor.workers.dev
```

> Ganti placeholder seperti `<ACCESS_TOKEN>`, `<REFRESH_TOKEN>`, `<ADMIN_API_TOKEN>`, `<USER_ID>`, `<SESSION_ID>`, `<CHALLENGE_ID>`, `<OTP>`, dan `<FAMILY_ID>` sebelum menjalankan command.

## Public

### Health

```bash
curl https://bengkel.irwanmotor.workers.dev/health
```

### Root Health

```bash
curl https://bengkel.irwanmotor.workers.dev/
```

### Dashboard UI

```bash
curl https://bengkel.irwanmotor.workers.dev/dashboard
```

## Auth

### Register Password (Start OTP)

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/register/password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "6281234567890",
    "username": "userbaru",
    "display_name": "User Baru",
    "password": "password123",
    "id_prefix": "US"
  }'
```

### Register Verify OTP

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/register/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "<CHALLENGE_ID>",
    "otp": "<OTP>"
  }'
```

### Login Password

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "ATHTHAA",
    "password": "<PASSWORD>"
  }'
```

### Login Start OTP by Phone

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "6281234567890"
  }'
```

### Login Verify OTP

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/login/verify \
  -H "Content-Type: application/json" \
  -d '{
    "challenge_id": "<CHALLENGE_ID>",
    "otp": "<OTP>"
  }'
```

### Refresh Token

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<REFRESH_TOKEN>"
  }'
```

### Get Current User

```bash
curl https://bengkel.irwanmotor.workers.dev/auth/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### List Current User Sessions

```bash
curl https://bengkel.irwanmotor.workers.dev/auth/sessions \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Revoke Current User Session by ID

```bash
curl -X DELETE https://bengkel.irwanmotor.workers.dev/auth/sessions/<SESSION_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Logout Current Session

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/logout \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Logout All Sessions

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/logout-all \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Introspect Access Token (Admin API Token)

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/introspect \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<ACCESS_TOKEN>"
  }'
```

### Require Permission (Admin API Token)

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/auth/require-permission \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<ACCESS_TOKEN>",
    "permission": "service:read"
  }'
```

## Admin API Token Endpoints

Endpoint di bagian ini memakai `Authorization: Bearer <ADMIN_API_TOKEN>`.

### List Users

```bash
curl "https://bengkel.irwanmotor.workers.dev/admin/users?limit=100" \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

### Get User by ID

```bash
curl https://bengkel.irwanmotor.workers.dev/admin/users/<USER_ID> \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

### Update User Status

```bash
curl -X PATCH https://bengkel.irwanmotor.workers.dev/admin/users/<USER_ID>/status \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

### Grant User Permission

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/users/<USER_ID>/permissions \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_key": "service:read",
    "service_key": "irwanmotor-auth",
    "description": "Read access"
  }'
```

### Revoke User Permission

```bash
curl -X DELETE https://bengkel.irwanmotor.workers.dev/admin/users/<USER_ID>/permissions/service%3Aread \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

### GoWA Health

```bash
curl https://bengkel.irwanmotor.workers.dev/admin/gowa/health \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

### Seed Initial Data

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/seed/initial \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

### Create Backup Snapshot

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/backup/snapshot \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

### Export Audit Backup

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/backup/audit-export \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

### Rate Limit Reset

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/ratelimit/reset \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ratelimit:login:identifier:athtaa"
  }'
```

### Rate Limit State

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/ratelimit/state \
  -H "Authorization: Bearer <ADMIN_API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ratelimit:login:identifier:athtaa"
  }'
```

## Hyperdashboard Admin Endpoints

Endpoint di bagian ini memakai user hyperuser dengan `Authorization: Bearer <ACCESS_TOKEN>`.

### Dashboard Summary

```bash
curl https://bengkel.irwanmotor.workers.dev/admin/dashboard/summary \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Bootstrap

```bash
curl https://bengkel.irwanmotor.workers.dev/admin/dashboard/bootstrap \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Infra

```bash
curl https://bengkel.irwanmotor.workers.dev/admin/dashboard/infra \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Settings

```bash
curl https://bengkel.irwanmotor.workers.dev/admin/dashboard/settings \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Update Dashboard Settings

```bash
curl -X PUT https://bengkel.irwanmotor.workers.dev/admin/dashboard/settings \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "otp_ttl_seconds": 300,
      "otp_resend_cooldown_seconds": 60,
      "otp_max_attempts": 5
    }
  }'
```

### Dashboard List Users

```bash
curl "https://bengkel.irwanmotor.workers.dev/admin/dashboard/users?limit=100&q=" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Create User

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/dashboard/users \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "created@example.com",
    "phone": "6281234567891",
    "username": "createduser",
    "display_name": "Created User",
    "password": "password123",
    "status": "active",
    "is_hyperuser": false,
    "settings": {
      "skip_otp": false,
      "refresh_token_ttl_days": 30,
      "access_token_ttl_seconds": 900,
      "notes": "created from collection"
    }
  }'
```

### Dashboard Get User

```bash
curl https://bengkel.irwanmotor.workers.dev/admin/dashboard/users/<USER_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Update User

```bash
curl -X PATCH https://bengkel.irwanmotor.workers.dev/admin/dashboard/users/<USER_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "phone": "6281234567891",
    "username": "updateduser",
    "display_name": "Updated User",
    "status": "active",
    "is_hyperuser": false,
    "settings": {
      "skip_otp": true,
      "refresh_token_ttl_days": 30,
      "access_token_ttl_seconds": 900,
      "notes": "updated from collection"
    }
  }'
```

### Dashboard Reset User Password

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/dashboard/users/<USER_ID>/password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "newpassword123"
  }'
```

### Dashboard Revoke All User Sessions

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/dashboard/users/<USER_ID>/sessions/revoke-all \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Revoke Session

```bash
curl -X DELETE https://bengkel.irwanmotor.workers.dev/admin/dashboard/sessions/<SESSION_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Revoke Refresh Token

```bash
curl -X DELETE https://bengkel.irwanmotor.workers.dev/admin/dashboard/refresh-tokens/<REFRESH_TOKEN_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Revoke Refresh Token Family

```bash
curl -X DELETE https://bengkel.irwanmotor.workers.dev/admin/dashboard/refresh-token-families/<FAMILY_ID> \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Audit Events

```bash
curl "https://bengkel.irwanmotor.workers.dev/admin/dashboard/audit?limit=100" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard OTP Challenges

```bash
curl "https://bengkel.irwanmotor.workers.dev/admin/dashboard/otp?limit=100" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Expire OTP Challenge

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/dashboard/otp/<CHALLENGE_ID>/expire \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard KV Keys

```bash
curl "https://bengkel.irwanmotor.workers.dev/admin/dashboard/kv?prefix=&limit=50&include_values=false" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Dashboard Durable Rate Limit State

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/dashboard/durable/rate-limit-state \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ratelimit:login:identifier:athtaa"
  }'
```

### Dashboard Durable Rate Limit Reset

```bash
curl -X POST https://bengkel.irwanmotor.workers.dev/admin/dashboard/durable/rate-limit-reset \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "ratelimit:login:identifier:athtaa"
  }'
```

---

# Bengkel Management API (`/api/v1`)

Bagian ini menambahkan API aplikasi tanpa mengubah endpoint auth di atas. Semua endpoint memerlukan:

```text
Authorization: Bearer <ACCESS_TOKEN>
```

Mutation berisiko tinggi juga memerlukan header unik:

```text
Idempotency-Key: <UNIQUE_KEY>
```

Response sukses dan error memakai envelope yang sama:

```json
{
  "ok": true,
  "request_id": "req_...",
  "items": []
}
```

```json
{
  "ok": false,
  "code": "invalid_transition",
  "message": "Status Service Order tidak dapat diubah dari waiting ke completed",
  "request_id": "req_..."
}
```

Kode error utama: `validation_error` (400), `unauthorized` (401), `forbidden` (403), `not_found` (404), `*_duplicate`/`invalid_transition`/`already_paid` (409), `provider_unavailable` (502), dan `provider_not_configured` (503). Error tidak menampilkan SQL, stack trace, binding, atau credential provider.

## Dashboard dan Mekanik

| Method | Path | Role | Query/body |
| --- | --- | --- | --- |
| GET | `/api/v1/dashboard` | Admin, Mechanic, Cashier | - |
| GET | `/api/v1/mechanics` | Admin | - |

```bash
curl "$BASE/api/v1/dashboard" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Dashboard berisi KPI, perhatian operasional, Service Order aktif, status mekanik, revenue, dan booking berikutnya. Agregat D1 ini dapat disimpan di KV selama 30 detik.

## Pelanggan dan Kendaraan

| Method | Path | Role | Query/body |
| --- | --- | --- | --- |
| GET | `/api/v1/customers` | Admin, Cashier | `q`, `status`, `page`, `limit` |
| POST | `/api/v1/customers` | Admin, Cashier | `name`, `phone`, opsional `email`, `address` |
| GET | `/api/v1/customers/:id` | Admin, Cashier | - |
| PATCH | `/api/v1/customers/:id` | Admin, Cashier | field pelanggan yang diubah |
| GET | `/api/v1/vehicles` | Admin, Cashier | `q`, `customer_id`, `page`, `limit` |
| POST | `/api/v1/vehicles` | Admin, Cashier | `customer_id`, `brand`, `model`, `license_plate`, opsional `year`, `color`, `odometer` |
| GET | `/api/v1/vehicles/:id` | Admin, Cashier | - |
| PATCH | `/api/v1/vehicles/:id` | Admin, Cashier | field kendaraan yang diubah |

```bash
curl -X POST "$BASE/api/v1/customers" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Andi Pratama","phone":"628123450001","address":"Jakarta Selatan"}'

curl -X POST "$BASE/api/v1/vehicles" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"<CUSTOMER_ID>","brand":"Honda","model":"Vario 160","year":2024,"license_plate":"B 4832 UZT","odometer":12450}'
```

Telepon pelanggan dan nomor polisi unik. Duplikasi menghasilkan 409 dengan `customer_duplicate` atau `vehicle_duplicate`.

## Booking

| Method | Path | Role | Query/body |
| --- | --- | --- | --- |
| GET | `/api/v1/bookings` | Admin | `q`, `status`, `date`, `page`, `limit` |
| POST | `/api/v1/bookings` | Admin | `customer_id`, `vehicle_id`, `scheduled_at`, `complaint`, opsional `channel` |
| GET | `/api/v1/bookings/:id` | Admin | - |
| PATCH | `/api/v1/bookings/:id` | Admin | `{ "status": "confirmed|cancelled|no_show" }` |
| POST | `/api/v1/bookings/:id/check-in` | Admin | opsional `mechanic_id`, `priority` |

```bash
curl -X POST "$BASE/api/v1/bookings" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking-2026-001" \
  -d '{"customer_id":"<CUSTOMER_ID>","vehicle_id":"<VEHICLE_ID>","scheduled_at":"2026-07-17T03:00:00.000Z","complaint":"Motor bergetar saat kecepatan rendah","channel":"whatsapp"}'

curl -X POST "$BASE/api/v1/bookings/<BOOKING_ID>/check-in" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"priority":"normal"}'
```

Create dengan idempotency key yang sama mengembalikan booking lama (`replayed: true`). Check-in berulang tidak membuat Service Order kedua.

## Service Order dan Tugas

| Method | Path | Role | Query/body |
| --- | --- | --- | --- |
| GET | `/api/v1/service-orders` | Admin, Mechanic | `q`, `status`, `mechanic_id`, `page`, `limit` |
| GET | `/api/v1/service-orders/:id` | Admin, Mechanic yang ditugaskan | - |
| PATCH | `/api/v1/service-orders/:id/assignment` | Admin | `{ "mechanic_id": "<MECHANIC_ID>" }` |
| POST | `/api/v1/service-orders/:id/transition` | Admin, Mechanic yang ditugaskan | `status`, opsional `inspection_notes`, `mechanic_id`, `estimated_completion` |
| POST | `/api/v1/service-orders/:id/tasks` | Admin, Mechanic yang ditugaskan | `name`, opsional `description`, `assigned_mechanic_id` |
| POST | `/api/v1/tasks/:id/complete` | Admin, Mechanic yang ditugaskan | `{}` |
| POST | `/api/v1/service-orders/:id/parts` | Admin, Mechanic yang ditugaskan | `spare_part_id`, `quantity` + idempotency key |

```bash
curl -X POST "$BASE/api/v1/service-orders/<SERVICE_ORDER_ID>/transition" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"inspection","inspection_notes":"CVT kotor; kampas rem menipis."}'

curl -X POST "$BASE/api/v1/service-orders/<SERVICE_ORDER_ID>/parts" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: so-part-001" \
  -d '{"spare_part_id":"<SPARE_PART_ID>","quantity":1}'
```

Transisi normal: `waiting → inspection → approval → in_progress → quality_check → ready → completed`. `quality_check → in_progress` diperbolehkan untuk rework. Penggunaan spare part membuat movement stok yang dapat diaudit dan menolak stok negatif.

## Spare Part dan Inventori

| Method | Path | Role | Query/body |
| --- | --- | --- | --- |
| GET | `/api/v1/spare-parts` | Admin, Mechanic | `q`, `status`, `stock=low|critical|normal`, `page`, `limit` |
| POST | `/api/v1/spare-parts` | Admin | `sku`, `name`, `category`, harga, batas stok, lokasi |
| GET | `/api/v1/spare-parts/:id` | Admin, Mechanic | - |
| PATCH | `/api/v1/spare-parts/:id` | Admin | field spare part yang diubah |
| POST | `/api/v1/spare-parts/:id/movements` | Admin | `type`, `quantity`, opsional `reference_type`, `reference_id`, `notes` + idempotency key |
| GET | `/api/v1/suppliers` | Admin | - |
| POST | `/api/v1/stock-receipts` | Admin | dokumen supplier dan array `items` + idempotency key |

```bash
curl -X POST "$BASE/api/v1/stock-receipts" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: stock-in-2026-001" \
  -d '{
    "supplier_id":"<SUPPLIER_ID>",
    "supplier_document_no":"SJ-2026-001",
    "received_at":"2026-07-16T04:00:00.000Z",
    "note":"Penerimaan pagi",
    "items":[
      {"spare_part_id":"<SPARE_PART_ID>","quantity":10,"unit_cost":47500}
    ]
  }'
```

`type` movement: `stock_in`, `service_use`, `direct_sale`, `adjustment_in`, `adjustment_out`, atau `return`. Stock receipt menggunakan D1 batch; replay tidak menambah stok dua kali.

## Invoice, Kasir, dan Transaksi

| Method | Path | Role | Query/body |
| --- | --- | --- | --- |
| GET | `/api/v1/invoices` | Admin, Cashier | `q`, `status`, `page`, `limit` |
| GET | `/api/v1/invoices/:id` | Admin, Cashier | - |
| POST | `/api/v1/service-orders/:id/invoice` | Admin | `labor_amount`, opsional `discount`, `tax` |
| POST | `/api/v1/invoices/:id/payments` | Admin, Cashier | `method`, `cash_received` untuk cash + idempotency key |
| GET | `/api/v1/transactions` | Admin, Cashier | `q`, `page`, `limit` |
| GET | `/api/v1/providers` | Admin, Mechanic, Cashier | status cash/QRIS/transfer |

```bash
curl -X POST "$BASE/api/v1/invoices/<INVOICE_ID>/payments" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: payment-2026-001" \
  -d '{"method":"cash","cash_received":500000}'
```

Invoice hanya dibuat pada Service Order berstatus `quality_check`, `ready`, atau `completed`. Satu invoice hanya dapat dibayar satu kali. Cash kurang dari total menghasilkan `insufficient_cash`. QRIS dan transfer menghasilkan `provider_not_configured` selama adapter settlement belum tersedia; endpoint status tidak mengubah data.

## Notifikasi, Laporan, dan Aktivitas

| Method | Path | Role | Query/body |
| --- | --- | --- | --- |
| GET | `/api/v1/notifications` | Semua role | `unread=true`, `page`, `limit` |
| POST | `/api/v1/notifications/:id/read` | Semua role | `{}` |
| POST | `/api/v1/notifications/read-all` | Semua role | `{}` |
| GET | `/api/v1/reports/analytics` | Admin | `from=YYYY-MM-DD`, `to=YYYY-MM-DD` |
| GET | `/api/v1/activity` | Admin | `q`, `page`, `limit` |

```bash
curl "$BASE/api/v1/reports/analytics?from=2026-07-01&to=2026-07-31" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

curl -X POST "$BASE/api/v1/notifications/<NOTIFICATION_ID>/read" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

Mark-read aman bila diulang. Laporan dihitung dari D1 dan dapat disimpan di KV selama 60 detik.

## R2 Attachment

| Method | Path | Role | Keterangan |
| --- | --- | --- | --- |
| POST | `/api/v1/attachments` | Admin, Mechanic | Upload body file mentah maksimal 5 MB |

Jika binding R2 `BUCKET` belum dikonfigurasi, endpoint upload dan download lampiran mengembalikan `503 provider_not_configured`. Modul operasional lain tetap tersedia.
| GET | `/files/:id` | Admin, Mechanic, Cashier | Stream object terautentikasi |

```bash
curl -X POST "$BASE/api/v1/attachments" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: image/jpeg" \
  -H "Content-Length: <BYTE_LENGTH>" \
  -H "X-Entity-Type: service-order" \
  -H "X-Entity-Id: <SERVICE_ORDER_ID>" \
  --data-binary "@service-photo.jpg"
```

Tipe entity yang diizinkan: `vehicle`, `service-order`, dan `spare-part` (format underscore juga diterima). Object key dibuat server; nama bucket dan key internal tidak dikirim ke browser.

## Provider Komunikasi

| Method | Path | Role | Keterangan |
| --- | --- | --- | --- |
| GET | `/api/v1/providers/communications` | Semua role | Status WhatsApp/email |
| GET | `/api/v1/providers/communications/whatsapp/health` | Semua role | Health adapter bila dikonfigurasi |
| POST | `/api/v1/providers/communications/whatsapp` | Semua role | `{ "to", "message" }` |
| POST | `/api/v1/providers/communications/email` | Semua role | Selalu 503 sampai provider ditambahkan |

```bash
curl -X POST "$BASE/api/v1/providers/communications/whatsapp" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"to":"628123450001","message":"Booking Anda telah dikonfirmasi."}'
```

Response `202 accepted` hanya berarti adapter WhatsApp menerima request upstream, bukan bukti pesan telah dibaca. Tanpa GOWA, API mengembalikan `provider_not_configured`; kegagalan upstream menjadi `provider_unavailable`.
