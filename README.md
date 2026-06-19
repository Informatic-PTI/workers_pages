# Irwan Motor Auth

Auth Worker untuk tugas kampus `irwanmotor`. Project ini memakai Cloudflare Workers, D1, Durable Objects, Queues, KV, dan R2 untuk password login, OTP WhatsApp, JWT access token, refresh token rotation, session revoke, audit log, backup, dan hyperdashboard.

Source referensi production ada di `C:\Users\athth\Documents\project\workers\workers-auth`, tetapi repo itu tidak perlu disentuh.

## Bootstrap Credential

Credential lokal dan note tim ada di `.var.vir.vur`.

Hyperuser awal:

```text
id: ATHTHAA
password: awikwok123
```

`ATHTHAA` diseed sebagai `is_hyperuser=1` dan `skip_otp=1` karena belum ada nomor WhatsApp. Setelah masuk dashboard, isi nomor phone lalu ubah `skip_otp=false` kalau ingin login hyperuser memakai OTP.

## Setup

Install dependency:

```bash
npm install
```

Buat resource Cloudflare:

```bash
npx wrangler d1 create irwanmotor_auth_core
npx wrangler queues create irwanmotor-auth-otp
npx wrangler queues create irwanmotor-auth-audit
npx wrangler queues create irwanmotor-auth-backup
```

KV dan R2 bisa otomatis dibuat oleh Wrangler saat deploy karena binding di `wrangler.jsonc` tidak mengunci ID. Jika ingin manual, buat namespace/bucket dari dashboard lalu isi `id` atau `bucket_name` ke `wrangler.jsonc`.

Apply schema:

```bash
npx wrangler d1 migrations apply irwanmotor_auth_core --local
npx wrangler d1 migrations apply irwanmotor_auth_core --remote
```

Untuk local dev, Wrangler membaca `.dev.vars` atau `.env`, bukan `.var.vir.vur`. Repo ini sudah dibuatkan `.dev.vars` lokal dari secret yang sama, dan file itu di-ignore oleh git.

Set secret Cloudflare:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put REFRESH_TOKEN_PEPPER
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put OTP_PEPPER
npx wrangler secret put ADMIN_API_TOKEN
npx wrangler secret put GOWA_API_TOKEN
```

Seed database:

```bash
$env:PASSWORD_PEPPER="<PASSWORD_PEPPER>"
$env:SEED_HYPERUSER_PASSWORD="awikwok123"
npm run seed -- --local
npm run seed
```

## Run

```bash
npm test -- --run
npx wrangler dev
```

Dashboard:

```text
http://localhost:8787/dashboard
```

Health:

```text
GET /health
```

## Auth API

Password login:

```bash
curl.exe -X POST "$BASE/auth/login/password" `
  -H "Content-Type: application/json" `
  -d "{\"identifier\":\"ATHTHAA\",\"password\":\"awikwok123\"}"
```

Jika user `skip_otp=false`, response berisi `challenge_id`; lanjut:

```bash
curl.exe -X POST "$BASE/auth/login/verify" `
  -H "Content-Type: application/json" `
  -d "{\"challenge_id\":\"otp_xxx\",\"otp\":\"123456\"}"
```

Endpoint utama:

- `POST /auth/register/password`
- `POST /auth/register/verify`
- `POST /auth/login/password`
- `POST /auth/login/verify`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /auth/sessions`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `POST /auth/introspect`
- `POST /auth/require-permission`
- `GET /admin/users`
- `POST /admin/seed/initial`
- `POST /admin/backup/snapshot`
- `GET /dashboard`

Admin API token memakai bearer token dari `.var.vir.vur`:

```bash
curl.exe "$BASE/admin/users" -H "Authorization: Bearer <ADMIN_API_TOKEN>"
```

## OTP

OTP memakai `GOWA_API_BASE` dan `GOWA_API_TOKEN`. Default local ada di `wrangler.jsonc`:

```text
GOWA_API_BASE=http://localhost:3000
```

Adapter mengirim:

```json
{ "phone": "6281234567890", "message": "Kode OTP ..." }
```

ke:

```text
POST /send/message
```

Plaintext OTP hanya ada di payload queue/direct delivery, tidak disimpan di D1 dan tidak ditampilkan dashboard.

## Notes

- `wrangler.jsonc` adalah source of truth binding Worker.
- Jalankan `npx wrangler types` setelah mengubah binding.
- Jangan copy credential dari project `workers-auth`.
- Untuk deploy sungguhan, ubah `AUTH_ISSUER` dari `http://localhost:8787` ke URL Worker deployment.
