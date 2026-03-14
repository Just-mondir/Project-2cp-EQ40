## Heritage Community Algeria – Backend (Authentication & Users)

This is the **Django REST API backend** for the *Heritage Community Algeria* project (module: **Authentication & User Management**).
It exposes a JWT-based authentication system with email + OTP verification and user profile management.

The backend is designed to be **modular**: only the `users` and `core` apps exist now, but more apps (posts, communities, monuments, events, moderation) can be added under `apps/` later.

---

### 1. Prerequisites

- **Python**: 3.11+
- **Pip**: latest recommended
- **Virtualenv** (recommended)
- **Git**
- **Docker + Docker Compose** (only if running with Docker)

No external database is required for local development: **SQLite** is used by default.

---

### 2. Installation & Setup (Local, Without Docker)

All commands below are run from the `heritage_backend/` folder.

1. **Clone the repository (if needed)**  
   ```bash
   git clone <your-repo-url>
   cd "Projet 2cp/heritage_backend"
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # Linux/macOS
   ```

3. **Install dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Create the `.env` file from `.env.example`**
   ```bash
   copy .env.example .env       # Windows
   # or
   cp .env.example .env         # Linux/macOS
   ```

   Edit `.env` as needed (at least set a strong `SECRET_KEY` in production).

5. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (for Django admin)**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run the development server**
   ```bash
   python manage.py runserver
   ```

   The API will be available at: `http://127.0.0.1:8000/`

---

### 3. Installation & Setup (With Docker)

This setup runs Django behind **Gunicorn**, connected to a **PostgreSQL** database in Docker.  
Local development can still use SQLite outside Docker; PostgreSQL is optional for students.

1. **Copy environment file**
   ```bash
   cd "Projet 2cp/heritage_backend"
   copy .env.example .env
   ```

   Make sure `DJANGO_SETTINGS_MODULE=config.settings.production` if you want true production settings inside Docker, or keep development settings if you prefer.

2. **Build and start services**
   ```bash
   docker compose up --build
   ```

3. **Apply migrations inside the container (first run)**
   ```bash
   docker compose exec web python manage.py migrate
   ```

4. **Create a superuser inside the container**
   ```bash
   docker compose exec web python manage.py createsuperuser
   ```

5. **Stop services**
   ```bash
   docker compose down
   ```

The web service listens on port `8000`: `http://127.0.0.1:8000/`.

---

### 4. Environment Variables

All environment variables are read from `.env` using `django-environ`.

- **DEBUG**: `True` or `False`  
  Controls Django debug mode. Use `False` in production.

- **SECRET_KEY**:  
  Django secret key. Must be strong and kept secret in production.

- **DJANGO_SETTINGS_MODULE**:  
  - `config.settings.development` for local development
  - `config.settings.production` for production / Docker

- **EMAIL_BACKEND**:  
  Default: `django.core.mail.backends.console.EmailBackend` (prints emails/OTPs to console).

- **DEFAULT_FROM_EMAIL**:  
  Default: `Heritage Community Algeria <noreply@heritage-algeria.com>`

- **ACCESS_TOKEN_LIFETIME_MINUTES**:  
  Default: `60` – lifetime of access tokens.

- **REFRESH_TOKEN_LIFETIME_DAYS**:  
  Default: `7` – lifetime of refresh tokens.

For Docker + PostgreSQL, you can extend `.env` with database settings or use `DATABASE_URL` if you add that later; by default this project still uses **SQLite** unless reconfigured.

---

### 5. Running Migrations

**Local (without Docker):**
```bash
cd "Projet 2cp/heritage_backend"
python manage.py migrate
```

**With Docker:**
```bash
cd "Projet 2cp/heritage_backend"
docker compose exec web python manage.py migrate
```

---

### 6. Creating a Superuser

**Local:**
```bash
python manage.py createsuperuser
```

**Docker:**
```bash
docker compose exec web python manage.py createsuperuser
```

Then log into the Django admin at `http://127.0.0.1:8000/admin/`.

---

### 7. Postman Testing Guide

Base URL for all examples below (development):

- `http://127.0.0.1:8000/api/`

#### 7.a Register – `POST /api/auth/register/`

- **Method**: `POST`
- **URL**: `/api/auth/register/`
- **Headers**:
  - `Content-Type: application/json`

**Request body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "username": "heritage_fan",
  "display_name": "Heritage Fan",
  "expertise": "student"
}
```

**Expected success response (201):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "user_id": 1
  }
}
```

**Common error responses:**

- **409 Conflict (email or username already exists)**
  ```json
  {
    "success": false,
    "message": "Registration failed.",
    "errors": {
      "email": [
        "A user with this email already exists."
      ]
    }
  }
  ```

- **400 Validation error (missing fields, invalid expertise, weak password, etc.)**
  ```json
  {
    "success": false,
    "message": "Registration failed.",
    "errors": {
      "expertise": [
        "“wrong” is not a valid choice."
      ]
    }
  }
  ```

---

#### 7.b Verify Email (OTP) – `POST /api/auth/verify-email/`

- **Method**: `POST`
- **URL**: `/api/auth/verify-email/`
- **Headers**:
  - `Content-Type: application/json`

You can provide either `user_id` or `email` plus the `otp_code`.

**Request body (JSON):**
```json
{
  "user_id": 1,
  "otp_code": "123456"
}
```

**Expected success response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "refresh": "<refresh-token>",
    "access": "<access-token>",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "heritage_fan",
      "display_name": "Heritage Fan",
      "bio": "",
      "expertise": "student",
      "speciality": "",
      "profile_picture": "",
      "badge": "",
      "is_verified": true,
      "role": "user",
      "created_at": "2025-01-01T12:00:00Z",
      "updated_at": "2025-01-01T12:05:00Z"
    }
  }
}
```

**Error responses:**

- **400 Invalid OTP**
  ```json
  {
    "success": false,
    "message": "Email verification failed.",
    "errors": {
      "otp_code": [
        "Invalid OTP."
      ]
    }
  }
  ```

- **400 Expired OTP**
  ```json
  {
    "success": false,
    "message": "Email verification failed.",
    "errors": {
      "otp_code": [
        "OTP expired. Please request a new one."
      ]
    }
  }
  ```

- **400 OTP already used**
  ```json
  {
    "success": false,
    "message": "Email verification failed.",
    "errors": {
      "otp_code": [
        "OTP already used."
      ]
    }
  }
  ```

---

#### 7.c Login – `POST /api/auth/login/`

- **Method**: `POST`
- **URL**: `/api/auth/login/`
- **Headers**:
  - `Content-Type: application/json`

**Request body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Expected success response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "data": {
    "user_id": 1
  }
}
```

**Error responses:**

- **401 Invalid credentials**
  ```json
  {
    "success": false,
    "message": "Login failed.",
    "errors": {
      "detail": [
        "Invalid credentials."
      ]
    }
  }
  ```

- **401 Email not verified**
  ```json
  {
    "success": false,
    "message": "Login failed.",
    "errors": {
      "detail": [
        "Email is not verified. Please verify your email first."
      ]
    }
  }
  ```

- **401 Account deactivated / banned**
  ```json
  {
    "success": false,
    "message": "Login failed.",
    "errors": {
      "detail": [
        "Account is deactivated or banned."
      ]
    }
  }
  ```

---

#### 7.d Verify Login OTP – `POST /api/auth/verify-login-otp/`

- **Method**: `POST`
- **URL**: `/api/auth/verify-login-otp/`
- **Headers**:
  - `Content-Type: application/json`

**Request body (JSON):**
```json
{
  "user_id": 1,
  "otp_code": "123456"
}
```

**Expected success response (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "refresh": "<refresh-token>",
    "access": "<access-token>",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "heritage_fan",
      "display_name": "Heritage Fan",
      "bio": "",
      "expertise": "student",
      "speciality": "",
      "profile_picture": "",
      "badge": "",
      "is_verified": true,
      "role": "user",
      "created_at": "2025-01-01T12:00:00Z",
      "updated_at": "2025-01-01T12:05:00Z"
    }
  }
}
```

**Error responses:**  
Same as email verification endpoint, but with `message: "Login OTP verification failed."`.

---

#### 7.e Refresh Token – `POST /api/auth/refresh/`

- **Method**: `POST`
- **URL**: `/api/auth/refresh/`
- **Headers**:
  - `Content-Type: application/json`

**Request body (JSON):**
```json
{
  "refresh": "<refresh-token>"
}
```

**Expected success response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "access": "<new-access-token>"
  }
}
```

**Error response (401 or 400 for invalid/expired refresh):**
```json
{
  "success": false,
  "message": "Token refresh failed.",
  "errors": {
    "detail": "Token is invalid or expired"
  }
}
```

---

#### 7.f Get My Profile – `GET /api/users/me/`

- **Method**: `GET`
- **URL**: `/api/users/me/`
- **Headers**:
  - `Authorization: Bearer <access-token>`

**Expected success response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "heritage_fan",
    "display_name": "Heritage Fan",
    "bio": "",
    "expertise": "student",
    "speciality": "",
    "profile_picture": "",
    "badge": "",
    "is_verified": true,
    "role": "user",
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-01T12:05:00Z"
  }
}
```

**Error (401 missing/invalid token):**
```json
{
  "success": false,
  "message": "Authentication credentials were not provided or invalid.",
  "errors": {
    "detail": "Authentication credentials were not provided."
  }
}
```

---

#### 7.g Update My Profile – `PATCH /api/users/me/`

- **Method**: `PATCH`
- **URL**: `/api/users/me/`
- **Headers**:
  - `Authorization: Bearer <access-token>`
  - `Content-Type: application/json`

**Allowed fields to update:**
- `display_name`
- `bio`
- `expertise` (must be one of: `amateur`, `student`, `researcher`, `architect`, `historian`, `guide`)
- `speciality`
- `profile_picture`

**Request body (JSON):**
```json
{
  "display_name": "New Display Name",
  "bio": "I love Algerian heritage!",
  "expertise": "researcher"
}
```

**Expected success response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "heritage_fan",
    "display_name": "New Display Name",
    "bio": "I love Algerian heritage!",
    "expertise": "researcher",
    "speciality": "",
    "profile_picture": "",
    "badge": "",
    "is_verified": true,
    "role": "user",
    "created_at": "2025-01-01T12:00:00Z",
    "updated_at": "2025-01-01T12:10:00Z"
  }
}
```

**Error (400 validation error):**
```json
{
  "success": false,
  "message": "Profile update failed.",
  "errors": {
    "expertise": [
      "“wrong” is not a valid choice."
    ]
  }
}
```

---

#### 7.h Delete My Account (Soft Delete) – `DELETE /api/users/me/`

- **Method**: `DELETE`
- **URL**: `/api/users/me/`
- **Headers**:
  - `Authorization: Bearer <access-token>`
  - `Content-Type: application/json` (optional, if sending body)

**Optional request body (JSON):**
```json
{
  "refresh": "<refresh-token>"
}
```

If you send the `refresh` token, it will be **blacklisted** so it cannot be used again.

**Expected success response (200):**
```json
{
  "success": true,
  "message": "Account deactivated successfully",
  "data": null
}
```

The `User` is **not hard-deleted**: `is_active` is set to `false`.

**Error (401 not authenticated):**
```json
{
  "success": false,
  "message": "Authentication credentials were not provided or invalid.",
  "errors": {
    "detail": "Authentication credentials were not provided."
  }
}
```

---

#### 7.i Get Public Profile by Username – `GET /api/users/<username>/`

- **Method**: `GET`
- **URL**: `/api/users/heritage_fan/`
- **Headers**: none required (public endpoint)

**Expected success response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "username": "heritage_fan",
    "display_name": "Heritage Fan",
    "bio": "",
    "expertise": "student",
    "speciality": "",
    "profile_picture": "",
    "badge": "",
    "role": "user",
    "created_at": "2025-01-01T12:00:00Z"
  }
}
```

**Error (404 user not found):**
```json
{
  "success": false,
  "message": "Resource not found.",
  "errors": {
    "detail": "Not found."
  }
}
```

---

### 8. How to Read OTP from Console Output

During development, the project uses:

- `EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'`

This means all emails are printed in the **terminal** where the Django server is running.

When you:
- Call `/api/auth/register/` or `/api/auth/login/`,

You will see something like:

```text
Subject: Heritage Community Algeria — Your Verification Code
From: Heritage Community Algeria <noreply@heritage-algeria.com>
To: user@example.com

Your verification code is: 482910
```

Use the **6-digit code** (e.g., `"482910"`) in the `otp_code` field in Postman for:

- `/api/auth/verify-email/`
- `/api/auth/verify-login-otp/`

---

### 9. Common Errors and Fixes

- **Invalid credentials on login**
  - Ensure email and password are correct.
  - Check that the user has verified their email.

- **OTP expired**
  - OTPs are valid for **10 minutes**.
  - If you see `"OTP expired. Please request a new one."`, call the corresponding start step again:
    - Re-register (for email verification) or
    - Re-login (for login OTP)

- **OTP already used**
  - Each OTP is **single-use**.
  - Call the registration or login endpoint again to get a new OTP.

- **Conflicts (409) when registering**
  - Email or username already exists in the system.
  - Use a different email or username.

- **401 – Missing or invalid JWT token**
  - For protected endpoints (e.g. `/api/users/me/`), you must send:
    - `Authorization: Bearer <access-token>`
  - Ensure the token is not expired; if it is, use `/api/auth/refresh/` with a valid refresh token.

- **Cannot log in after soft delete**
  - Soft delete sets `is_active = false`. Such users cannot log in.
  - Reactivate the user via Django admin or database if needed (for testing only).

- **CORS issues from frontend**
  - In development, `CORS_ALLOW_ALL_ORIGINS = True`, so any origin is allowed.
  - In production, tighten CORS in `config/settings/production.py` by setting:
    - `CORS_ALLOW_ALL_ORIGINS = False`
    - `CORS_ALLOWED_ORIGINS = ["https://your-frontend-domain"]`

- **Rate limiting**
  - For production, it is recommended to add `django-ratelimit` or similar to throttle:
    - Registration
    - Login
    - OTP verification endpoints  
  - This project does **not** include rate limiting by default, but it is easy to plug into the DRF views.

---

### 10. Security Checklist (Implemented)

- Passwords stored using Django’s default **PBKDF2** hasher.
- OTPs are **hashed** before storage and never returned in responses.
- OTPs are valid for **10 minutes** and are **single-use**.
- For each user + purpose, only one active OTP is kept; previous unused OTPs are deleted before a new one is created.
- JWT configuration via `djangorestframework-simplejwt` with:
  - Access tokens: default 60 minutes
  - Refresh tokens: default 7 days
  - **Token rotation** and **blacklisting** enabled.
- Logout and account deactivation both support **refresh token blacklisting**.
- Production settings enable secure cookies and security headers (HTTPS-only).
- All API responses are **standardized**:
  - Success: `{ "success": true, "message": "...", "data": { ... } }`
  - Error: `{ "success": false, "message": "...", "errors": { ... } }`
- CORS configured:
  - Development: allow all origins.
  - Production: should be restricted to trusted frontend origins.

This provides a solid, secure base for further modules (posts, communities, monuments, events, moderation) to be added later under `apps/`.

---

### 11. How Login & Password Hashing Work (Technical Summary)

#### Password Hashing

Passwords are **never stored in plain text**.

When a user registers, `UserManager.create_user()` calls `user.set_password(password)` which runs Django's built-in hasher:

```
PBKDF2 + SHA256 + random salt  →  stored in the DB as a hash string
```

Example of what is stored in `users_user.password`:
```
pbkdf2_sha256$870000$randomsalt$hashedvalue==
```

When the user logs in, `authenticate(username=email, password=password)` uses `check_password()` which hashes the provided password with the stored salt and compares — the plain password is never stored or logged anywhere.

---

#### OTP Hashing

OTP codes (6-digit numbers) are also **hashed before storage** using the same Django hasher:

```python
# Generation
plain_code = secrets.randbelow(1_000_000)  # cryptographically secure
hashed_code = make_password(plain_code)
OTPCode.objects.create(code=hashed_code, ...)

# Verification
check_password(plain_code_from_user, otp.code)
```

The plain OTP is only ever sent by email and never persisted anywhere.

---

#### Login Flow (Step by Step)

```
Frontend                          Backend
   │                                 │
   │  POST /api/auth/login/          │
   │  { email, password }   ────────►│  1. authenticate(email, password)
   │                                 │     → checks PBKDF2 hash ✓
   │                                 │  2. Generates 6-digit OTP
   │                                 │     → hashes it → stores in DB
   │                                 │  3. Sends OTP to user's email
   │◄──────── { user_id } ──────────│
   │                                 │
   │  POST /api/auth/verify-login-otp/
   │  { user_id, otp_code } ────────►│  4. Fetches latest LOGIN OTP for user
   │                                 │     → check_password(otp_code, hash) ✓
   │                                 │  5. Marks OTP as used (single-use)
   │                                 │  6. Issues JWT access + refresh tokens
   │◄─── { access, refresh, user } ─│
```

The frontend only needs to:
1. Call `POST /api/auth/login/` with email + password → save `user_id`
2. Read the OTP from the user's inbox
3. Call `POST /api/auth/verify-login-otp/` → save `access` and `refresh` tokens
4. Attach `Authorization: Bearer <access>` to all subsequent requests

---

#### Token Lifecycle

| Token | Lifetime (default) | Configurable via `.env` |
|-------|--------------------|------------------------|
| Access token | 60 minutes | `ACCESS_TOKEN_LIFETIME_MINUTES` |
| Refresh token | 7 days | `REFRESH_TOKEN_LIFETIME_DAYS` |

- When the access token **expires**, call `POST /api/auth/refresh/` with the refresh token.
- On **logout** or **account delete**, send the refresh token to be blacklisted so it cannot be reused.
- Refresh tokens **rotate**: each use of `/api/auth/refresh/` returns a new refresh token and invalidates the old one.


