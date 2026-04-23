# 21th April — Changes by Mondir

## Overview

Four issues were fixed in this session:

1. **Login bug** — Email login was broken (redirected back to login page)
2. **Join request emails** — Group admins now receive email notifications with approve/reject buttons
3. **XSS security** — Input sanitization added across backend + frontend
4. **Post caching** — Home page posts now load instantly using sessionStorage cache

---

## Issue 1 — Login Fix (No OTP, Direct Tokens)

### Problem
The backend login used a 2-step OTP flow:
- Step 1: `POST /api/auth/login/` → validated credentials, sent OTP email, returned `{ user_id }`
- Step 2: `POST /api/auth/verify-login-otp/` → verified OTP, returned JWT tokens

But the frontend expected tokens immediately from step 1. Since only `user_id` was returned, `saveAuthTokens()` failed → no token stored → AuthGate redirected to `/login`.

### Fix
Changed login to a **single-step flow**: email + password → JWT tokens directly (no OTP).

### Files Changed

**`apps/users/serializers.py`** — `LoginSerializer`
- `create()` method now generates `RefreshToken` and returns `{ access, refresh, user }` directly
- Removed OTP creation and email sending

```python
# BEFORE
def create(self, validated_data):
    user = validated_data["user"]
    _, plain_otp = create_hashed_otp(user, OTPPurposeChoices.LOGIN)
    send_otp_email(user.email, plain_otp)
    return user

# AFTER
def create(self, validated_data):
    user = validated_data["user"]
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserProfileSerializer(user).data,
    }
```

**`apps/users/views.py`** — `LoginView`
- Returns token data instead of `user_id`

```python
# BEFORE
user = serializer.save()
return api_success(message="OTP sent to your email", data={"user_id": user.pk}, status_code=200)

# AFTER
token_data = serializer.save()
return api_success(message="Login successful.", data=token_data, status_code=200)
```

**Frontend** — No changes needed. `login/page.tsx` already calls `saveAuthTokens(response)` which expects `{ access, refresh, user }`.

---

## Issue 2 — Group Join Request Email Notifications

### Problem
When a user submitted a join request for a group, the admin received no email notification.

### Fix
Added a complete email notification system modeled on the existing badge request email system.

### Files Changed

**`apps/thematic_groups/services.py`** — Added email infrastructure:
- `send_join_request_email()` — sends HTML email with Approve/Reject buttons to admin
- `build_join_review_token()` / `decode_join_review_token()` — signed token URLs using `TimestampSigner`
- `build_join_review_url()` — constructs approve/reject URLs
- `build_join_request_html()` — HTML email template with styled buttons

**`apps/thematic_groups/views.py`**:
- `GroupJoinRequestView.post()` — now sends email to admin after saving join request
- Added `GroupJoinRequestEmailReviewView` — handles GET from email links:
  - Decodes signed token → gets `request_id` + `action`
  - Updates join request status
  - Creates membership if approved
  - Sends in-app notification to requester

**`apps/thematic_groups/urls.py`**:
- Added URL: `groups/<group_id>/requests/email-review/<token>/`

### Email Flow
1. User sends join request → admin gets email with Approve/Reject buttons
2. Admin clicks button → hits `GroupJoinRequestEmailReviewView` endpoint
3. Token is verified (valid for 7 days), request is approved/rejected
4. If approved, user is added as group member
5. Requester gets in-app notification about the decision

---

## Issue 3 — XSS Security Enhancement

### Problem
- Backend stored raw HTML input without sanitization
- Post titles used `dangerouslySetInnerHTML` without sanitization on frontend
- No protection against `<script>` injection or malicious HTML

### Fix
Added `bleach`-based sanitization on all user-generated content.

### Dependencies
- Added `bleach==6.2.0` to `requirements.txt`

### Backend Changes

**`apps/posts/serializers.py`**:
- Added `sanitize_plain()` — strips ALL HTML tags (for titles, names)
- Added `sanitize_rich()` — allows only safe tags: `b, i, em, strong, u, br, p, span, ul, ol, li, a, h1, h2, h3`
- `PostDetailSerializer.validate()` — sanitizes `title`, `content`, `location`
- `CommentSerializer.validate()` — sanitizes `content`
- `AnnotationSerializer.validate()` — sanitizes `text`

**`apps/users/serializers.py`**:
- Added `_sanitize_plain()` helper
- `UserUpdateSerializer.validate()` — sanitizes `username`, `display_name`, `bio`, `speciality`

**`apps/thematic_groups/serializers.py`**:
- Added `_sanitize_plain()` helper
- `ThematicGroupWriteSerializer.validate()` — sanitizes `name`, `description`, `rules`

### Frontend Changes

**`Frontend/kunuz-app/src/app/home-page/page.tsx`**:
- Post title in `PostCard` now uses `sanitizeHtml(post.title)` instead of raw `post.title`

```jsx
// BEFORE
<div dangerouslySetInnerHTML={{ __html: post.title }} />

// AFTER
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.title) }} />
```

---

## Issue 4 — Post Loading Optimization with Caching

### Problem
Every navigation to `/home-page` triggered a full API reload. Posts were lost when navigating away. Users saw a loading spinner every time.

### Fix
Added `sessionStorage`-based caching with a **stale-while-revalidate** pattern.

### How It Works
1. **On fetch** — Post data is cached in `sessionStorage` (up to 60 posts / 3 pages)
2. **On mount** — If cache exists, posts are shown instantly (no loading spinner)
3. **Background refresh** — Page 1 is silently re-fetched to pick up new posts
4. **Scroll position** — Saved and restored on cache hit
5. **Merge strategy** — Fresh posts replace cached page-1 posts, older cached posts are kept

### Files Changed

**`Frontend/kunuz-app/src/app/home-page/page.tsx`**:
- Added cache helpers: `savePostsToCache()`, `loadPostsFromCache()`, `saveScrollPosition()`, `loadScrollPosition()`
- Added `useEffect` to restore from cache on mount + trigger background refresh
- Added scroll position tracking with `requestAnimationFrame` throttling
- Modified `IntersectionObserver` effect to cache after each fetch
- Added `cacheRestored` state to prevent duplicate fetches on cache restore

### Cache Keys
- `home_posts_cache` — serialized posts array
- `home_posts_next` — next pagination URL
- `home_posts_scroll` — scroll position in pixels

---

## Summary of All Modified Files

### Backend
| File | What Changed |
|------|-------------|
| `apps/users/serializers.py` | Login returns tokens directly + XSS sanitization |
| `apps/users/views.py` | LoginView returns token data |
| `apps/posts/serializers.py` | XSS sanitization for posts, comments, annotations |
| `apps/thematic_groups/services.py` | Email helpers for join request notifications |
| `apps/thematic_groups/views.py` | Email sending on join request + email review endpoint |
| `apps/thematic_groups/urls.py` | URL for email review endpoint |
| `apps/thematic_groups/serializers.py` | XSS sanitization for group fields |
| `requirements.txt` | Added `bleach==6.2.0` |

### Frontend
| File | What Changed |
|------|-------------|
| `src/app/home-page/page.tsx` | XSS fix for titles + sessionStorage caching |

---

## How to Test

1. **Login**: Go to `/login` → enter valid email + password → should redirect to `/home-page` with tokens stored
2. **Join request email**: Join a group → check admin's email inbox for approve/reject email
3. **XSS**: Try creating a post with `<script>alert('xss')</script>` in the title → should be stripped
4. **Caching**: Load home → navigate away → come back → posts should appear instantly without spinner
