# Reports Feature — Test Guide

> **Branch**: `integration`
> **Base URL**: `http://127.0.0.1:8000/api`

## Prerequisites

1. MongoDB running on `localhost:27017`
2. Run migrations: `python manage.py migrate`
3. Start the server: `python manage.py runserver 8000`
4. Use **Postman**, **Thunder Client**, or **curl** for requests

---

## Step 1 — Register User A

```
POST /api/auth/register/
Content-Type: application/json

{
  "email": "usera@test.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

Then verify email with the OTP printed in the console:

```
POST /api/auth/verify-email/
{ "user_id": "<user_id from register>", "otp": "<otp from console>" }
```

Then log in:

```
POST /api/auth/login/
{ "email": "usera@test.com", "password": "SecurePass123!" }
```

Verify login OTP:

```
POST /api/auth/verify-login-otp/
{ "user_id": "<user_id>", "otp": "<otp from console>" }
```

> Save the **access token** → `TOKEN_A`

---

## Step 2 — User A Creates a Post

```
POST /api/posts/
Authorization: Bearer TOKEN_A
Content-Type: application/json

{
  "title": "Historic Casbah of Algiers",
  "content": "The Casbah is a UNESCO World Heritage Site...",
  "post_type": "discovery"
}
```

> Save the **post id** from the response → `POST_ID`

---

## Step 3 — Register User B

Repeat Step 1 with a different email (e.g. `userb@test.com`).

> Save the **access token** → `TOKEN_B`

---

## Step 4 — User B Reports User A's Post

```
POST /api/reports/
Authorization: Bearer TOKEN_B
Content-Type: application/json

{
  "target_type": "post",
  "target_id": "<POST_ID>",
  "reason": "This post contains inaccurate historical claims about the site."
}
```

**Expected**: `201` with report data including `status: "pending"`.

---

## Step 5 — User B: Get My Reports

```
GET /api/reports/mine/
Authorization: Bearer TOKEN_B
```

**Expected**: `200` — paginated list containing the report from Step 4.

---

## Step 6 — User A: Get My Posts

```
GET /api/posts/me/
Authorization: Bearer TOKEN_A
```

**Expected**: `200` — paginated list containing the post from Step 2.

---

## Step 7 — Error Cases to Verify

### 7a. Duplicate Report (expect `409`)

Repeat the exact same request from Step 4.

**Expected**: `409` — `"You already have a pending report for this target."`

### 7b. Self-Report (expect `400`)

```
POST /api/reports/
Authorization: Bearer TOKEN_B
Content-Type: application/json

{
  "target_type": "user",
  "target_id": "<USER_B_ID>",
  "reason": "Trying to report myself should fail with an error."
}
```

**Expected**: `400` — `"You cannot report yourself."`

### 7c. Invalid Target Type (expect `400`)

```
POST /api/reports/
Authorization: Bearer TOKEN_B

{ "target_type": "xyzzy", "target_id": "1", "reason": "Invalid target type should fail." }
```

**Expected**: `400` — `"target_type must be one of: post, comment, user, event."`

### 7d. Non-existent Post (expect `400`)

```
POST /api/reports/
Authorization: Bearer TOKEN_B

{ "target_type": "post", "target_id": "999999", "reason": "This post does not exist in the database at all." }
```

**Expected**: `400` — `"Post not found."`

### 7e. Short Reason (expect `400`)

```
POST /api/reports/
Authorization: Bearer TOKEN_B

{ "target_type": "post", "target_id": "<POST_ID>", "reason": "short" }
```

**Expected**: `400` — `"Reason must be at least 10 characters."`

---

## Endpoints Summary

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| `POST` | `/api/reports/` | Bearer JWT | Submit a report |
| `GET` | `/api/reports/mine/` | Bearer JWT | List my reports |
| `GET` | `/api/reports/` | Moderator/Admin | List all reports (filterable by `?status=` and `?target_type=`) |
| `GET` | `/api/reports/<id>/` | Moderator/Admin | Get single report |
| `PATCH` | `/api/reports/<id>/resolve/` | Moderator/Admin | Resolve a report (`status`: `"reviewed"` or `"rejected"`) |
