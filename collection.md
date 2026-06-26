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
    "password": "awikwok123"
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
