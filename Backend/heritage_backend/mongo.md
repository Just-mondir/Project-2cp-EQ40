# Postman Testing — After MongoDB Migration

## What changed?

**Only one thing**: `user_id` in responses is now a MongoDB **ObjectId string** (24-char hex) instead of an integer.

```json
// Before (SQLite)         // After (MongoDB)
{ "user_id": 1 }          { "user_id": "69b22ff3cd869d84aa184c72" }
```

Everything else is **identical**: same endpoints, same headers, same request bodies, same response shapes.

---

## Gmail Setup (Real Email)

Update your local `.env` with this config:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_gmail@gmail.com
EMAIL_HOST_PASSWORD=your_16_char_app_password
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=your_gmail@gmail.com
```

Important:
- Use a Gmail **App Password** (not your normal Gmail password).
- Your Gmail account must have **2-Step Verification** enabled first.

How to create App Password:
1. Go to Google Account -> Security.
2. Enable 2-Step Verification.
3. Open App passwords.
4. Create one for "Mail" and copy the 16-character password.
5. Put it in `EMAIL_HOST_PASSWORD`.

Restart server after editing `.env`:

```bash
python manage.py runserver
```

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
→ Save the `user_id` string from the response. Check your Gmail inbox for the OTP.

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
→ Save `user_id`, check your Gmail inbox for new OTP.

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

With Gmail SMTP enabled, OTP is sent to the real recipient inbox instead of terminal output.

---

## What did NOT change
- All endpoint URLs
- All HTTP methods
- All request body fields
- All response fields (except `user_id` type: string vs int)
- Auth header: `Authorization: Bearer <token>`
- Error response format
