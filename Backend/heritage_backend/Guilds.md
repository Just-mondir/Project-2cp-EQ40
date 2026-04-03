# Mondir Guide: What Changed and How to Test

This guide documents the backend and frontend work completed from `todo.md`, how to test it with Postman, and how to integrate/use the new features in the frontend.

## 1. Summary of Implemented Features

### 1.1 Moderator actions (ban, suspend, role update)
Implemented in moderator module:
- `PATCH /api/moderator/users/{user_id}/role/`
- `PATCH /api/moderator/users/{user_id}/moderate/`

What it does:
- Moderator/admin can change user roles (`user`, `moderator`, `admin`).
- Moderator/admin can:
- ban user (`action=ban`)
- suspend user (`action=suspend`, requires `suspended_until`)
- reactivate user (`action=reactivate`)
- User moderation state fields were added in user model:
- `moderation_status`
- `moderation_reason`
- `suspended_until`

### 1.2 Thematic groups backend module
New app: `apps.thematic_groups`

Implemented endpoints:
- `GET /api/groups/`
- `POST /api/groups/`
- `GET /api/groups/{group_id}/`
- `PATCH /api/groups/{group_id}/`
- `GET /api/groups/{group_id}/members/`
- `POST /api/groups/{group_id}/join/`
- `PATCH /api/groups/{group_id}/requests/{request_id}/review/`
- `POST /api/groups/{group_id}/invite/`
- `PATCH /api/groups/invitations/{invitation_id}/respond/`
- `POST /api/groups/{group_id}/leave/`
- `GET /api/groups/{group_id}/posts/`
- `POST /api/groups/{group_id}/posts/`

What it does:
- Users can create/edit groups.
- Join requests are created by users and reviewed only by group admin.
- Members can invite users.
- Invite receiver can accept/refuse.
- Group-only post listing and creation is supported.
- Group post creation supports image upload via `uploaded_images`.

### 1.3 Group post visibility and access control
Implemented in posts module:
- New post fields:
- `group_id`
- `group_visibility` (`public` or `group_only`)

Behavior:
- Home feed endpoint (`GET /api/posts/`) now returns only `visibility=public`.
- For group-only posts:
- non-members cannot access post details/interactions
- saved/liked list keeps history but serializer returns unavailable placeholder content
- placeholder output:
- title = `Unavailable`
- content = `Rejoin the group to access this post.`

### 1.4 Badge requests module
New app: `apps.badges`

Implemented endpoints:
- `GET /api/badge-requests/`
- `POST /api/badge-requests/` (multipart form-data with document)
- `GET /api/badge-requests/{request_id}/`
- `PATCH /api/badge-requests/{request_id}/review/`

What it does:
- User uploads a document to request a badge.
- Request is stored with metadata and status.
- Email is sent to moderators/admins.
- Uploaded document is attached to the email (as requested).

### 1.5 Notifications improvements
Backend:
- Notification registry extended with new events (group invite, moderation actions, etc.).
- Notification serializer now includes actor fields for UI:
- `actor_display_name`
- `actor_username`
- `actor_profile_picture`
- `event_label`

Frontend:
- `src/components/Notificationpanel.tsx` replaced static mock data with real polling.
- Added notifications page:
- `src/app/notifications/page.tsx`
- Sidebar notification icon now routes to `/notifications`.

Polling and actions:
- Poll every 30 seconds.
- Uses:
- `GET /api/notifications/`
- `GET /api/notifications/unread-count/`
- `PATCH /api/notifications/{id}/read/`
- `PATCH /api/notifications/read-all/`

## 2. Test Status (Current)

### 2.1 Backend tests
Command:
`python manage.py test`

Result:
- `Found 16 test(s)`
- `OK`

Includes notification smoke tests for:
- list notifications endpoint
- mark notification read endpoint

### 2.2 Frontend changed-files lint
Command:
`npx eslint src/components/Notificationpanel.tsx src/app/notifications/page.tsx src/components/LeftSidebar.jsx`

Result:
- 0 errors
- 2 warnings (`no-img-element`) only

These warnings do not block runtime.

## 3. Postman Testing Guide

## 3.1 Setup
1. Create environment vars in Postman:
- `base_url` = `http://127.0.0.1:8000`
- `access_token` = (set after login)
- `moderator_user_id`
- `normal_user_id`
- `group_id`
- `request_id`
- `invitation_id`
- `badge_request_id`
- `notification_id`

2. Authorization tab (for protected endpoints):
- Type: Bearer Token
- Token: `{{access_token}}`

## 3.2 Auth quick flow
1. Login + OTP flow using existing auth endpoints.
2. Save JWT access token into `{{access_token}}`.

## 3.3 Moderator endpoints
### Update role
- Method: `PATCH`
- URL: `{{base_url}}/api/moderator/users/{{normal_user_id}}/role/`
- Body JSON:
```json
{
  "role": "moderator"
}
```

### Ban/Suspend/Reactivate
- Method: `PATCH`
- URL: `{{base_url}}/api/moderator/users/{{normal_user_id}}/moderate/`

Suspend example:
```json
{
  "action": "suspend",
  "reason": "Policy violation",
  "suspended_until": "2026-12-31T23:59:59Z"
}
```

Ban example:
```json
{
  "action": "ban",
  "reason": "Repeated abuse"
}
```

Reactivate example:
```json
{
  "action": "reactivate",
  "reason": "Appeal accepted"
}
```

## 3.4 Group flow tests
### Create group
- `POST {{base_url}}/api/groups/`
```json
{
  "name": "Ottoman Architecture",
  "category": "Architecture",
  "description": "Group about Ottoman sites",
  "profile_picture": "",
  "banner_image": ""
}
```
Save returned id to `{{group_id}}`.

### Request to join
- `POST {{base_url}}/api/groups/{{group_id}}/join/`

### Review join request (admin)
- `PATCH {{base_url}}/api/groups/{{group_id}}/requests/{{request_id}}/review/`
```json
{
  "status": "approved"
}
```

### Invite user
- `POST {{base_url}}/api/groups/{{group_id}}/invite/`
```json
{
  "recipient_id": "{{normal_user_id}}"
}
```

### Respond invitation
- `PATCH {{base_url}}/api/groups/invitations/{{invitation_id}}/respond/`
```json
{
  "status": "accepted"
}
```

### Create group post (with image)
- `POST {{base_url}}/api/groups/{{group_id}}/posts/`
- Body: form-data
- `title` = test post
- `content` = hello group
- `post_type` = question
- `uploaded_images` = file

### Check group posts
- `GET {{base_url}}/api/groups/{{group_id}}/posts/`

## 3.5 Badge request flow tests
### Submit badge request
- `POST {{base_url}}/api/badge-requests/`
- Body: form-data
- `document` = file (required)
- `message` = short text

Expected:
- 201 response
- request created
- moderator email triggered with attachment

### Review badge request (moderator)
- `PATCH {{base_url}}/api/badge-requests/{{badge_request_id}}/review/`
```json
{
  "status": "approved",
  "moderator_note": "Verified"
}
```

## 3.6 Notification flow tests
### List notifications
- `GET {{base_url}}/api/notifications/`

### Unread count
- `GET {{base_url}}/api/notifications/unread-count/`

### Mark single read
- `PATCH {{base_url}}/api/notifications/{{notification_id}}/read/`

### Mark all read
- `PATCH {{base_url}}/api/notifications/read-all/`

## 4. Frontend Integration Guide

## 4.1 Required env
In frontend `.env.local`:
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

## 4.2 Notification UI wiring
Already integrated:
- Component: `src/components/Notificationpanel.tsx`
- Route page: `src/app/notifications/page.tsx`
- Sidebar route: `src/components/LeftSidebar.jsx` (notifications icon -> `/notifications`)

## 4.3 Backend response fields expected by frontend notification panel
Each notification row expects:
- `id`
- `actor_display_name`
- `actor_username`
- `actor_profile_picture`
- `event_type`
- `event_label`
- `message`
- `is_read`
- `created_at`

## 4.4 Authentication requirements
- JWT access token must be stored in localStorage key `accessToken`.
- Notification panel reads this token for API requests.

## 5. Local Run Checklist

Backend:
1. `cd Backend/heritage_backend`
2. Ensure MongoDB is running.
3. `python manage.py runserver`
4. `python manage.py test`

Frontend:
1. `cd Frontend/kunuz-app`
2. `npm install`
3. `npm run dev`
4. Open `/notifications` and verify real data polling.

## 6. Notes
- Full project lint may still fail due unrelated pre-existing files not touched in this task.
- Changed-file lint and backend tests for this implementation are passing.
