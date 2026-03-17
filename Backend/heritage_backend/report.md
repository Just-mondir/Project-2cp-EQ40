# Reports Feature — Implementation Plan

## 1. Files to Create / Modify

### Files to fill (already exist as empty stubs)

| File | Purpose |
|---|---|
| `apps/reports/models.py` | MongoEngine `Report` document — the single source of truth for all reports stored in MongoDB |
| `apps/reports/serializers.py` | DRF serializers: `ReportCreateSerializer` (input validation + cross-DB existence checks), `ReportSerializer` (read output), `ReportResolveSerializer` (moderator resolution input) |
| `apps/reports/permissions.py` | `IsModeratorOrAdmin` custom DRF permission class |
| `apps/reports/views.py` | Four API views: submit, list-mine, list-all (mod), detail+resolve (mod) |
| `apps/reports/urls.py` | URL patterns wired under `api/reports/` |

### Files to modify

| File | Change |
|---|---|
| `config/settings/base.py` | Add `"apps.reports"` to `INSTALLED_APPS` (required for DRF to discover the app) |
| `config/urls.py` | Add `path("api/", include("apps.reports.urls"))` |

---

## 2. The `Report` MongoEngine Document

```python
class Report(me.Document):
    reporter_id   = me.StringField(required=True)           # MongoDB ObjectId string of the user who filed the report
    target_type   = me.StringField(required=True)           # One of: "post" | "comment" | "user" | "event"
    target_id     = me.StringField(required=True)           # post/comment → integer PK as string; user → ObjectId string
    reason        = me.StringField(required=True)           # Free-text reason, minimum 10 characters
    status        = me.StringField(default="pending")       # Lifecycle: "pending" → "reviewed" | "rejected"
    moderator_note = me.StringField(default="")             # Optional note added by the moderator when resolving
    resolved_by   = me.StringField(null=True, default=None) # ObjectId string of the moderator/admin who resolved it
    created_at    = me.DateTimeField()                      # Set automatically on first save (timezone.now)
    resolved_at   = me.DateTimeField(null=True, default=None) # Set when status changes from "pending"

    meta = {
        "collection": "reports",
        "indexes": [
            "reporter_id",
            "target_type",
            "status",
            # Compound index used for duplicate-pending-report check
            {"fields": ["reporter_id", "target_type", "target_id", "status"]},
        ],
    }
```

### Field-by-field rationale

| Field | Type | Why |
|---|---|---|
| `reporter_id` | `StringField` | MongoDB ObjectId strings; no ForeignKey allowed across DBs |
| `target_type` | `StringField` | Enum enforced in serializer, not at doc level, to keep error messages user-friendly |
| `target_id` | `StringField` | Holds an integer-as-string (post/comment) OR an ObjectId-as-string (user/event); normalised to string to keep the schema uniform |
| `reason` | `StringField` | Min-length (10) checked in serializer |
| `status` | `StringField` | Three-state lifecycle: `pending` is the default; moderators flip it to `reviewed` or `rejected` |
| `moderator_note` | `StringField` | Optional free-text from moderator; empty string by default |
| `resolved_by` | `StringField` | ObjectId of the resolving moderator/admin, null until resolved |
| `created_at` | `DateTimeField` | Set in `save()` override the first time; never updated |
| `resolved_at` | `DateTimeField` | Set in the resolve view at resolution time |

---

## 3. API Endpoints

### 3.1 Submit a Report
```
POST  /api/reports/
Auth: Bearer JWT (IsAuthenticated)
```

**Request body**
```json
{
  "target_type": "post",
  "target_id":   "42",
  "reason":      "This post contains false historical claims."
}
```

**Success `201`**
```json
{
  "success": true,
  "message": "Report submitted successfully.",
  "data": {
    "id":          "<mongo_object_id>",
    "target_type": "post",
    "target_id":   "42",
    "reason":      "This post contains false historical claims.",
    "status":      "pending",
    "created_at":  "2026-03-16T10:00:00Z"
  }
}
```

**Error responses**

| Code | Condition |
|---|---|
| `400` | `target_type` not in allowed list |
| `400` | `reason` shorter than 10 characters |
| `400` | `target_id` empty or missing |
| `404` | Target resource does not exist (post/comment/user) |
| `400` | Reporter is trying to report themselves (`target_type=="user"`, `target_id==reporter_id`) |
| `409` | A pending report by the same user for the same target already exists |
| `401` | Missing or invalid JWT |

---

### 3.2 List My Reports
```
GET  /api/reports/mine/
Auth: Bearer JWT (IsAuthenticated)
Query params: ?page=1&page_size=20
```

**Success `200`** — paginated with `StandardResultsSetPagination`
```json
{
  "success": true,
  "message": "Results retrieved successfully.",
  "data": {
    "count": 3,
    "next": null,
    "previous": null,
    "results": [
      {
        "id":           "<mongo_object_id>",
        "target_type":  "post",
        "target_id":    "42",
        "reason":       "...",
        "status":       "pending",
        "moderator_note": "",
        "created_at":   "2026-03-16T10:00:00Z",
        "resolved_at":  null
      }
    ]
  }
}
```

---

### 3.3 List All Reports (Moderator/Admin)
```
GET  /api/reports/
Auth: Bearer JWT (IsModeratorOrAdmin)
Query params: ?status=pending&target_type=post&page=1&page_size=20
```

`status` filter accepts: `pending` | `reviewed` | `rejected`  
`target_type` filter accepts: `post` | `comment` | `user` | `event`

**Success `200`** — same paginated envelope as 3.2, results include full fields plus `reporter_id`, `resolved_by`

**Error responses**

| Code | Condition |
|---|---|
| `403` | Authenticated user is not moderator or admin |
| `401` | Missing or invalid JWT |

---

### 3.4 Get a Single Report (Moderator/Admin)
```
GET  /api/reports/<report_id>/
Auth: Bearer JWT (IsModeratorOrAdmin)
```

**Success `200`**
```json
{
  "success": true,
  "message": "Report retrieved successfully.",
  "data": {
    "id":             "<mongo_object_id>",
    "reporter_id":    "<mongo_object_id>",
    "target_type":    "user",
    "target_id":      "<mongo_object_id>",
    "reason":         "...",
    "status":         "pending",
    "moderator_note": "",
    "resolved_by":    null,
    "created_at":     "2026-03-16T10:00:00Z",
    "resolved_at":    null
  }
}
```

**Error responses**

| Code | Condition |
|---|---|
| `404` | No report with that MongoDB ObjectId exists |
| `403` | User is not moderator or admin |
| `401` | Missing or invalid JWT |

---

### 3.5 Resolve a Report (Moderator/Admin)
```
PATCH  /api/reports/<report_id>/resolve/
Auth: Bearer JWT (IsModeratorOrAdmin)
```

**Request body**
```json
{
  "status":         "reviewed",
  "moderator_note": "Post has been reviewed and removed."
}
```

`status` must be `"reviewed"` or `"rejected"` (cannot set back to `"pending"`).  
`moderator_note` is optional (empty string allowed).

**Success `200`**
```json
{
  "success": true,
  "message": "Report resolved successfully.",
  "data": {
    "id":             "<mongo_object_id>",
    "reporter_id":    "<mongo_object_id>",
    "target_type":    "post",
    "target_id":      "42",
    "reason":         "...",
    "status":         "reviewed",
    "moderator_note": "Post has been reviewed and removed.",
    "resolved_by":    "<moderator_mongo_object_id>",
    "created_at":     "2026-03-16T10:00:00Z",
    "resolved_at":    "2026-03-16T11:00:00Z"
  }
}
```

**Error responses**

| Code | Condition |
|---|---|
| `404` | Report not found |
| `400` | `status` is missing or is `"pending"` |
| `400` | Report is already resolved (status is not `"pending"`) |
| `403` | User is not moderator or admin |
| `401` | Missing or invalid JWT |

---

## 4. Validation Logic (step by step)

### `ReportCreateSerializer.validate()` execution order

```
1. Check target_type ∈ {"post", "comment", "user", "event"}
   └─ fail 400: "target_type must be one of: post, comment, user, event."

2. Check reason length >= 10 characters
   └─ fail 400: "Reason must be at least 10 characters."

3. Normalise target_id: strip whitespace, check non-empty
   └─ fail 400: "target_id is required."

4. target_type == "user":
   a. Check target_id != reporter_id
      └─ fail 400: "You cannot report yourself."
   b. Try User.objects.get(id=target_id)  [MongoEngine]
      └─ fail 404: "User not found."

5. target_type == "post":
   a. Try int(target_id) — catch ValueError
      └─ fail 400: "target_id must be a valid integer for post targets."
   b. Post.objects.filter(id=int(target_id), is_deleted=False).exists()  [Django ORM]
      └─ fail 404: "Post not found."

6. target_type == "comment":
   a. Try int(target_id) — catch ValueError
      └─ fail 400: "target_id must be a valid integer for comment targets."
   b. Comment.objects.filter(id=int(target_id)).exists()  [Django ORM]
      └─ fail 404: "Comment not found."

7. target_type == "event":
   → Skip existence check (events app not built yet). Log a note.

8. Duplicate-pending check:
   Report.objects(
       reporter_id=reporter_id,
       target_type=target_type,
       target_id=target_id,
       status="pending"
   ).count() > 0
   └─ fail 409: "You already have a pending report for this target."
```

### `ReportResolveSerializer.validate()` execution order

```
1. Check status ∈ {"reviewed", "rejected"}
   └─ fail 400: "status must be 'reviewed' or 'rejected'."

2. Check report.status == "pending"
   └─ fail 400: "This report has already been resolved."
```

---

## 5. Mixed Database Strategy

The system uses two completely separate databases that never share a connection:

| Database | ORM / ODM | Models stored |
|---|---|---|
| MongoDB | MongoEngine | `User`, `OTPCode`, `BlacklistedToken`, `Report` |
| SQLite | Django ORM | `Post`, `Comment`, `Gem`, `Save`, `PostImage` |

### Cross-DB lookups in serializer validation

Because there are no database-level foreign keys across MongoDB and SQLite, all cross-DB lookups happen **in Python**, inside the serializer's `validate()` method, before the `Report` document is ever saved.

```
Report.reporter_id  ─► str(request.user.id)         (already in memory, no extra query)
Report.target_id
  ├─ "user"    ─► User.objects.get(id=target_id)     ← MongoEngine query to MongoDB
  ├─ "post"    ─► Post.objects.filter(id=int(target_id), is_deleted=False)  ← Django ORM → SQLite
  ├─ "comment" ─► Comment.objects.filter(id=int(target_id))                 ← Django ORM → SQLite
  └─ "event"   ─► no lookup (not yet built)
```

The `Report` document stores only **string identifiers** — it never holds a live Python reference to a Post or User object. When reading reports back, `reporter_id` and `target_id` are plain strings in the JSON output; the front end or a future enrichment layer can resolve them independently.

---

## 6. Permission Class — `IsModeratorOrAdmin`

Located in `apps/reports/permissions.py`.

```
has_permission returns True if ALL of:
  - request.user is authenticated (is_authenticated == True)
  AND ANY of:
  - request.user.role == "moderator"
  - request.user.role == "admin"
  - request.user.is_staff == True
```

This mirrors the existing `has_perm` logic on the `User` document and the `IsSelf` pattern in `apps/users/permissions.py`.

---

## 7. Serializer Classes Summary

| Class | Used by | Input / Output |
|---|---|---|
| `ReportCreateSerializer` | `POST /api/reports/` | Input: `target_type`, `target_id`, `reason`. Performs all validation. Creates and returns `Report`. |
| `ReportSerializer` | All GET endpoints | Output: full report representation (all fields). |
| `ReportResolveSerializer` | `PATCH /api/reports/<id>/resolve/` | Input: `status`, `moderator_note`. Validates and applies resolution. |

All serializers are plain `rest_framework.serializers.Serializer` subclasses (NOT `ModelSerializer`) because `Report` is a MongoEngine document, not a Django model.

---

## 8. View Classes Summary

| Class | URL | Methods | Permission |
|---|---|---|---|
| `ReportCreateView` | `/api/reports/` | `POST` | `IsAuthenticated` |
| `MyReportsView` | `/api/reports/mine/` | `GET` | `IsAuthenticated` |
| `ReportListView` | `/api/reports/` | `GET` | `IsModeratorOrAdmin` |
| `ReportDetailView` | `/api/reports/<id>/` | `GET` | `IsModeratorOrAdmin` |
| `ReportResolveView` | `/api/reports/<id>/resolve/` | `PATCH` | `IsModeratorOrAdmin` |

`ReportCreateView` and `ReportListView` share the same URL `/api/reports/` but use different HTTP methods, so they can be combined into a single `APIView` with `def get` (mod only) and `def post` (authenticated).

---

## 9. URL Patterns

```
api/reports/                  ← GET (mod) + POST (auth)
api/reports/mine/             ← GET (auth)
api/reports/<str:report_id>/          ← GET (mod)
api/reports/<str:report_id>/resolve/  ← PATCH (mod)
```

`report_id` is a MongoDB ObjectId string (24-character hex), passed as `<str:report_id>` in Django URL patterns.

---

## 10. Assumptions

1. **`apps.reports` must be added to `INSTALLED_APPS`** even though it uses MongoEngine. DRF's URL routing and app registry still require it.

2. **No migration needed** for the `Report` document. MongoEngine creates the collection and indexes automatically on first document insertion. The `migrations/` directory inside `apps/reports/` (which currently doesn't exist) will NOT be created.

3. **`target_id` for events** is treated as an opaque string. No existence check is performed because the events app is not yet built. This is safe because a pending report on a non-existent event is a low-risk data condition; when the events app is later built, the validation can be added in one line.

4. **`reporter_id` is always `str(request.user.id)`**, set server-side from the JWT. The client never sends it. This prevents reporter ID spoofing.

5. **Pagination for mod list** reuses `StandardResultsSetPagination` (page_size=20, max=100) from `apps.core.pagination`, consistent with the rest of the project.

6. **`Comment` has no `is_deleted` flag** in the existing model. The existence check for comment reports will simply verify `Comment.objects.filter(id=int(target_id)).exists()`.

7. **The `POST /api/reports/` endpoint is `IsAuthenticated` only** — ordinary users cannot list all reports; they can only see their own via `/api/reports/mine/`.

8. **Status `"pending"` is the only valid initial state.** It is set server-side and never accepted from the client on creation.

9. **MongoEngine's `me.StringField` does not enforce `min_length` at the driver level** in this project's MongoEngine version; the 10-character minimum for `reason` is enforced at the serializer level, consistent with how validation is handled everywhere else in the project.

10. **`resolved_at` is a separate field** (not derived from `updated_at`) to make the resolution timestamp unambiguous and independently queryable.
