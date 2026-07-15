# Bengkel Irwan Motor Management System

Aplikasi manajemen bengkel full-stack berbasis Cloudflare Workers dan Workers Static Assets. Frontend Vanilla JavaScript di `public/` menangani booking, pelanggan, kendaraan, Service Order, pekerjaan mekanik, inventori, kasir, laporan, notifikasi, dan aktivitas. Worker di `src/` menyediakan API yang menggunakan auth lama tanpa mengganti kontrak login, token, refresh token, session, OTP, atau hyperdashboard.

## Arsitektur

- `public/index.html`, `public/css/`, `public/js/`: satu SPA ES Modules dengan hash router, shell bersama, navigasi berbasis role, dan API client terpusat.
- `src/routes/`: pemetaan method/path ke controller.
- `src/controllers/`: autentikasi/otorisasi, parsing request, dan response HTTP.
- `src/services/`: aturan domain, workflow, validasi bisnis, konkurensi, dan idempotensi.
- `src/repositories/`: akses D1, KV, dan R2 melalui binding Worker.
- `migrations/`: migrasi D1 auth lama dan migrasi domain bengkel yang bersifat aditif.
- `scripts/`: seed auth, seed bengkel, serta pemeriksaan statis frontend.
- `test/`: pengujian Worker pada runtime Miniflare/Vitest dengan migrasi D1 nyata.

Workers Static Assets adalah jalur full-stack utama: aset dilayani dari `public/`, sedangkan `/api/*`, `/auth/*`, `/admin/*`, `/health`, `/dashboard`, dan `/files/*` selalu masuk ke Worker. File sumber Stitch mentah dipertahankan secara lokal sebagai bahan referensi, tetapi dikecualikan dari paket aset melalui `public/.assetsignore`.

## Cloudflare resources

Binding di `wrangler.jsonc` adalah source of truth:

| Binding | Resource | Fungsi |
| --- | --- | --- |
| `DB`, `AUTH_DB` | D1 `irwanmotor_auth_core` | Sumber kebenaran auth dan data operasional |
| `CACHE`, `AUTH_CACHE` | KV | Cache agregat singkat serta cache auth lama |
| `BUCKET` | R2 opsional (belum diaktifkan) | Foto/dokumen; endpoint lampiran mengembalikan `provider_not_configured` selama binding tidak tersedia |
| `AUTH_RATE_LIMITER`, `AUTH_SESSION_GUARD` | Durable Objects | Rate limit dan session guard auth lama |
| `OTP_QUEUE`, `AUDIT_QUEUE`, `BACKUP_QUEUE` | Queues | Delivery OTP, audit, dan job backup |
| `ASSETS` | Workers Static Assets | SPA di `public/` |

`DB` dan `AUTH_DB` sengaja menunjuk database yang sama agar foreign key ke identitas auth tetap valid. Demikian pula `CACHE` dan `AUTH_CACHE` menunjuk namespace yang sama dengan prefix key terpisah. Browser tidak pernah menerima akses binding.

Jika resource belum ada, buat lalu salin ID hasilnya ke `wrangler.jsonc`:

```powershell
npx wrangler d1 create irwanmotor_auth_core
npx wrangler kv namespace create CACHE
npx wrangler r2 bucket create irwanmotor-uploads
npx wrangler queues create irwanmotor-auth-otp
npx wrangler queues create irwanmotor-auth-audit
npx wrangler queues create irwanmotor-auth-backup
npx wrangler types
```

## Environment dan secrets

Secret tidak disimpan di repository. Wrangler membaca `.dev.vars` untuk lokal; file ini sudah diabaikan oleh Git. Gunakan `npx wrangler secret put NAME` untuk remote:

```text
JWT_SECRET=<random-secret>
REFRESH_TOKEN_PEPPER=<random-secret>
PASSWORD_PEPPER=<random-secret>
OTP_PEPPER=<random-secret>
ADMIN_API_TOKEN=<random-secret>
GOWA_API_TOKEN=<optional-provider-token>
SEED_HYPERUSER_PASSWORD=<development-only-password>
```

Secret inti yang wajib di production:

```powershell
npx wrangler secret put JWT_SECRET
npx wrangler secret put REFRESH_TOKEN_PEPPER
npx wrangler secret put PASSWORD_PEPPER
npx wrangler secret put OTP_PEPPER
npx wrangler secret put ADMIN_API_TOKEN
```

Tambahkan `GOWA_API_TOKEN` dengan `npx wrangler secret put GOWA_API_TOKEN` hanya bila adapter WhatsApp GOWA diaktifkan. Endpoint production saat ini menggunakan `GOWA_API_BASE=https://gowa1.punya.top`; nilainya dapat diubah sebagai variable non-secret. QRIS dan transfer tetap nonaktif sampai adapter settlement riil diimplementasikan; variable/flag saja tidak dianggap sebagai bukti pembayaran.

## Instalasi, migrasi, dan seed lokal

Gunakan Node.js versi LTS yang didukung Wrangler:

```powershell
npm install
npx wrangler d1 migrations apply irwanmotor_auth_core --local
```

Seed bersifat eksplisit dan menggunakan `INSERT OR IGNORE`. Perintah seed membaca password dan `PASSWORD_PEPPER` dari `.dev.vars`, bukan dari source:

```powershell
npm run seed -- --local

npm run seed:workshop -- --local

npm run seed:super
```

Seed bengkel membuat data demo yang koheren untuk Admin, mekanik `rizky`, kasir `kasir`, Andi Pratama, Rama Saputra, dua kendaraan, Service Order, spare part, invoice, dan notifikasi. Gunakan password dari `SEED_STAFF_PASSWORD` untuk kedua akun staf. Jangan menjalankan seed remote tanpa meninjau target database dan variable environment.

`npm run seed:super` menambahkan dataset pameran yang jauh lebih lengkap dari `superseed.sql`: 14 pelanggan, 15 kendaraan, booking historis dan mendatang, Service Order pada seluruh tahap workflow, beberapa mekanik, tugas servis, supplier, penerimaan serta movement stok, 20 barang dengan nama produk nyata dan SKU internal demo, invoice, pembayaran tunai, notifikasi, dan audit trail. Kontak memakai domain/nomor fiktif dan SKU tidak diklaim sebagai nomor part OEM. File ini idempotent sehingga aman dijalankan ulang pada database lokal yang sama.

Jika dataset ini memang hendak dipasang pada D1 remote, tinjau isi dan target akun terlebih dahulu lalu jalankan secara eksplisit:

```powershell
node scripts/seed-super.js --remote
```

Runner membagi `superseed.sql` menjadi beberapa batch kecil agar tidak melewati batas batch D1/Miniflare. Perintah remote tersebut sengaja tidak dijadikan npm script agar data dummy tidak masuk production tanpa keputusan sadar.

Untuk migrasi remote yang telah ditinjau:

```powershell
npx wrangler d1 migrations apply irwanmotor_auth_core --remote
```

## Development dan verifikasi

Full-stack lokal (frontend dan API pada origin yang sama):

```powershell
npm run dev
```

Buka `http://127.0.0.1:8787/`. SPA menggunakan route seperti `/#/dashboard`, sedangkan hyperdashboard auth lama tetap ada di `/dashboard`.

Preview Pages statis dapat dipakai untuk memeriksa aset saja:

```powershell
npm run dev:pages
```

Karena frontend sengaja memakai API relative/same-origin, workflow data lengkap dijalankan dengan `wrangler dev`; preview Pages statis tidak menyediakan API Worker ini.

Jalankan pemeriksaan:

```powershell
npm run check:frontend
npm run test:run
npm run types
npx wrangler deploy --dry-run
```

## Auth yang dipertahankan

Frontend mengadaptasi kontrak auth yang sudah ada:

1. `POST /auth/login/password` dengan `{ "identifier", "password" }`.
2. Jika response berisi `otp_required`, frontend melanjutkan ke `POST /auth/login/verify` dengan `challenge_id` dan OTP.
3. `access_token` disimpan di `sessionStorage`; refresh token dapat dipertahankan di `localStorage` bila pengguna memilih opsi ingat saya.
4. Semua API aplikasi mengirim `Authorization: Bearer <ACCESS_TOKEN>`.
5. `GET /auth/me` tetap kompatibel dan sekarang menambahkan daftar `roles` untuk navigasi Admin, Mechanic, atau Cashier.
6. Access token kedaluwarsa sesuai konfigurasi lama; API client melakukan satu refresh terkoordinasi melalui `POST /auth/refresh`, lalu menghapus session jika refresh gagal.

Endpoint auth, admin token API, serta hyperdashboard lama tetap didokumentasikan di `collection.md`.

## Role experience dan authorization

- Admin: seluruh operasi booking, pelanggan, kendaraan, Service Order, inventori, kasir, laporan, aktivitas, dan pengaturan.
- Mechanic: dashboard, pekerjaan yang ditugaskan, Service Order terkait, penggunaan spare part, notifikasi, profil, dan status provider.
- Cashier: dashboard, antrian invoice, pembayaran, transaksi, pelanggan/kendaraan, notifikasi, profil, dan status provider.

Penyembunyian menu hanya untuk pengalaman pengguna. Setiap endpoint aplikasi juga memeriksa bearer token, role, dan permission pada backend. Mekanik hanya dapat membaca Service Order yang ditugaskan kepadanya.

## Alur operasional penting

- Booking memakai `Idempotency-Key`; check-in berulang mengembalikan Service Order yang sama.
- Status Service Order hanya boleh mengikuti transisi `waiting → inspection → approval → in_progress → quality_check → ready → completed`. Quality check dapat mengembalikan pekerjaan ke `in_progress`.
- Penyelesaian tugas aman bila diulang.
- Mutasi stok dan penerimaan stok diproses dengan D1 batch, merekam stok sebelum/sesudah, menolak stok negatif, dan membutuhkan idempotency key.
- Penggunaan spare part pada Service Order sekaligus membuat movement stok yang dapat diaudit.
- Invoice hanya dibuat setelah quality check. Satu invoice hanya dapat memiliki satu pembayaran berstatus `paid`; pembayaran tunai memvalidasi jumlah diterima dan menghitung kembalian.
- Notification mark-read dan mark-all-read idempotent.
- Dashboard serta laporan memakai cache KV berumur 30–60 detik; D1 tetap menjadi sumber kebenaran dan entry kedaluwarsa secara alami.
- Saat R2 diaktifkan, upload maksimal 5 MB, hanya tipe file yang diizinkan, memakai generated key, dan diunduh melalui endpoint Worker terautentikasi. Tanpa binding `BUCKET`, upload/download mengembalikan `503 provider_not_configured` tanpa mengganggu modul lain.

## External providers

- WhatsApp memakai adapter GOWA lama melalui service binding `GOWA_VPC` atau `GOWA_API_BASE` + `GOWA_API_TOKEN`. Tanpa konfigurasi, API mengembalikan `provider_not_configured`; kegagalan upstream mengembalikan `provider_unavailable`.
- Email belum memiliki provider dan selalu melaporkan `provider_not_configured`.
- Cash diproses langsung di D1. QRIS dan transfer tidak memalsukan konfirmasi: tanpa adapter provider, API mengembalikan status konfigurasi yang jujur dan menolak pembayaran eksternal.
- R2 saat ini opsional dan belum diaktifkan pada account production. Aktifkan R2, buat bucket `irwanmotor-uploads`, lalu tambahkan kembali binding `BUCKET` untuk mengaktifkan lampiran.

## API dan response

Semua endpoint aplikasi berada di `/api/v1` dan dijelaskan di `collection.md`. Response sukses mengikuti format lama yang diperluas:

```json
{ "ok": true, "request_id": "req_...", "items": [] }
```

Response error tidak menampilkan SQL, stack trace, secret, atau detail binding:

```json
{ "ok": false, "code": "validation_error", "message": "...", "request_id": "req_..." }
```

## Deployment

Deployment production tidak dijalankan otomatis dari proses development. Setelah secrets, resource, migrasi remote, dan provider ditinjau:

```powershell
npm run test:run
npm run check:frontend
npx wrangler d1 migrations apply irwanmotor_auth_core --remote
npm run deploy
```

Production Worker yang dikonfigurasi saat ini: `https://bengkel.irwanmotor.workers.dev`.
