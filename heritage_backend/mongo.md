# Postman Testing — After MongoDB Migration

## What changed?

**Only one thing**: `user_id` in responses is now a MongoDB **ObjectId string** (24-char hex) instead of an integer.

```json
// Before (SQLite)         // After (MongoDB)
{ "user_id": 1 }          { "user_id": "69b22ff3cd869d84aa184c72" }
```

Everything else is **identical**: same endpoints, same headers, same request bodies, same response shapes.

---

## Quick Test Flow (copy-paste ready)

### 1. Register
```
POST http://127.0.0.1:8000/api/auth/register/
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "StrongPass123!",
  "username": "testuser",
  "display_name": "Test User",
  "expertise": "student"
}
```
→ Save the `user_id` string from the response. Check the terminal for your OTP code.

---

### 2. Verify Email
```
POST http://127.0.0.1:8000/api/auth/verify-email/
Content-Type: application/json

{
  "user_id": "69b22ff3cd869d84aa184c72",
  "otp_code": "482910"
}
```
→ Save `access` and `refresh` tokens from the response.

---

### 3. Get My Profile
```
GET http://127.0.0.1:8000/api/users/me/
Authorization: Bearer <access-token>
```

---

### 4. Login (existing user)
```
POST http://127.0.0.1:8000/api/auth/login/
Content-Type: application/json

{
  "email": "you@example.com",
  "password": "StrongPass123!"
}
```
→ Save `user_id`, check terminal for new OTP.

---

### 5. Verify Login OTP
```
POST http://127.0.0.1:8000/api/auth/verify-login-otp/
Content-Type: application/json

{
  "user_id": "69b22ff3cd869d84aa184c72",
  "otp_code": "123456"
}
```

---

## Reading the OTP (dev mode)

The server prints it to the terminal running `manage.py runserver`:
```
Your verification code is: 482910
```

---

## What did NOT change
- All endpoint URLs
- All HTTP methods
- All request body fields
- All response fields (except `user_id` type: string vs int)
- Auth header: `Authorization: Bearer <token>`
- Error response format
