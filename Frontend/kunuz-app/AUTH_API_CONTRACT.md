# Authentication API Contract (from integration branch backend source)

Source of truth read from:
- Backend/heritage_backend/apps/users/urls.py
- Backend/heritage_backend/apps/users/views.py
- Backend/heritage_backend/apps/users/serializers.py

Base URL:
- http://127.0.0.1:8000/api

## 1) Register
Endpoint:
- POST /auth/register/

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (success):
- HTTP 201
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "user_id": "<mongo_user_id_string>"
  }
}
```

Error behavior:
- HTTP 409 when email or username already exists
- HTTP 400 for other validation errors

## 2) Verify Email OTP
Endpoint:
- POST /auth/verify-email/

Request body:
```json
{
  "user_id": "<mongo_user_id_string>",
  "otp_code": "123456"
}
```

Response (success):
- HTTP 200
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "refresh": "<jwt_refresh>",
    "access": "<jwt_access>",
    "user": {
      "id": "<id>",
      "email": "user@example.com"
    }
  }
}
```

Notes:
- Backend accepts either user_id or email with otp_code.
- OTP errors come as HTTP 400 with field-level messages in errors.otp_code.

## 3) Login (credentials stage)
Endpoint:
- POST /auth/login/

Request body:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response (success):
- HTTP 200
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "user_id": "<mongo_user_id_string>"
  }
}
```

Error behavior:
- HTTP 401 for invalid credentials / not verified / inactive account

## 4) Verify Login OTP
Endpoint:
- POST /auth/verify-login-otp/

Request body:
```json
{
  "user_id": "<mongo_user_id_string>",
  "otp_code": "123456"
}
```

Response (success):
- HTTP 200
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "refresh": "<jwt_refresh>",
    "access": "<jwt_access>",
    "user": {
      "id": "<id>",
      "email": "user@example.com"
    }
  }
}
```

## Frontend flow mapping
- Signup page calls register.
- On register success, store pending context (user_id + flow=signup + email) and navigate to verify page.
- Verify page submits otp_code to:
  - /auth/verify-email/ when flow=signup
  - /auth/verify-login-otp/ when flow=login
- On OTP success:
  - store access token and refresh token in localStorage
  - store user object in localStorage
  - navigate to /home-page
- Login page calls /auth/login/ and then redirects to verify page with flow=login.
