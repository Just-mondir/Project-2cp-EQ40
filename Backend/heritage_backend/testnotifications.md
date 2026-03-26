# Notifications Feature — Test Guide

> **Base URL**: `http://127.0.0.1:8000/api`

## Architecture

This feature uses **REST Polling**. The Next.js frontend should periodically call the `/api/notifications/unread-count/` endpoint (e.g. every 30s using SWR) to show a badge, and fetch from `/api/notifications/` when the user opens the notification dropdown.

The events currently supported are:
- `gem_on_post`: Someone liked your post
- `comment_on_post`: Someone commented on your post
- `reply_to_comment`: Someone replied to your comment
- `gem_on_comment`: Someone liked your comment

---

## Step 1 — Setup Test Users

1. Open **two** Postman windows (or use two different browsers/sessions).
2. Register and Login **User A** (save `TOKEN_A`).
3. Register and Login **User B** (save `TOKEN_B`).

*(See `testreport.md` for exact Auth endpoint details if needed).*

---

## Step 2 — User A Creates a Post & Comment

**Create a Post (User A)**:
```http
POST /api/posts/
Authorization: Bearer TOKEN_A
Content-Type: application/json

{
  "title": "My Beautiful Post",
  "content": "Hello world",
  "post_type": "discovery"
}
```
> Save the **post id** → `POST_ID`

**Create a Comment on that Post (User A)**:
```http
POST /api/posts/<POST_ID>/comments/
Authorization: Bearer TOKEN_A
Content-Type: application/json

{
  "content": "I am the author commenting on my own post."
}
```
> Save the **comment id** → `COMMENT_ID_A`

---

## Step 3 — User B Triggers Notifications

Let's trigger all 4 notification types:

**1. Gem User A's Post** (`gem_on_post`)
```http
POST /api/posts/<POST_ID>/gem/
Authorization: Bearer TOKEN_B
```

**2. Comment on User A's Post** (`comment_on_post`)
```http
POST /api/posts/<POST_ID>/comments/
Authorization: Bearer TOKEN_B
Content-Type: application/json

{
  "content": "Nice post!"
}
```

**3. Reply to User A's Comment** (`reply_to_comment`)
```http
POST /api/posts/<POST_ID>/comments/
Authorization: Bearer TOKEN_B
Content-Type: application/json

{
  "content": "I completely agree with you.",
  "parent": <COMMENT_ID_A>
}
```

**4. Gem User A's Comment** (`gem_on_comment`)
```http
POST /api/posts/comments/<COMMENT_ID_A>/gem/
Authorization: Bearer TOKEN_B
```

---

## Step 4 — User A Fetches Notifications

**1. Get Unread Count**
```http
GET /api/notifications/unread-count/
Authorization: Bearer TOKEN_A
```
*Expected Response*:
```json
{
  "success": true,
  "message": "Unread count retrieved.",
  "data": {
    "unread_count": 4
  }
}
```

**2. Fetch Notifications List**
```http
GET /api/notifications/      # Fetch all
GET /api/notifications/?is_read=false   # Fetch only unread
Authorization: Bearer TOKEN_A
```
*Expected Response*: A paginated list containing 4 notification objects, each with an `event_type` and a pre-formatted `message` (e.g., "User B liked your comment").

---

## Step 5 — Mark as Read

**1. Mark a single notification as read**
```http
PATCH /api/notifications/<NOTIFICATION_ID>/read/
Authorization: Bearer TOKEN_A
```

**2. Mark all as read**
```http
PATCH /api/notifications/read-all/
Authorization: Bearer TOKEN_A
```

*Verify*: Call `GET /api/notifications/unread-count/` again, it should return `0`.
