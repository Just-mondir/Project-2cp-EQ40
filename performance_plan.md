# Performance Enhancement Implementation Plan

This document outlines the step-by-step implementation plan to drastically improve the performance of our platform (Home page, Events, and massive data requests), based on a deep analysis of both the backend (Django/MongoEngine) and frontend (Next.js) codebases.

## 1. Backend Optimizations (Django / MongoEngine)

The primary reason the posts and events are loading slowly is a massive **N+1 query problem**. For every single post loaded, the backend currently makes upwards of 8-10 separate database queries.

### Action Items:
*   **Implement Bulk Fetching & ID Mapping (`serializers.py` & `views.py`):**
    *   *Problem:* Methods like `_get_user_by_id`, `PostImage.objects(post=obj)`, and `AlertDetails.objects.get` are executed per-post inside loops.
    *   *Solution:* Modify `PostListSerializer` and the views to fetch all necessary related IDs (authors, images, details, gems, saves) in **bulk** using `id__in` operators before serializing. We will pass a pre-loaded dictionary via the serializer `context` so the serializer performs 0 additional database hits per item.
*   **Optimize Aggregations:** 
    *   Instead of calling `.count()` individually for Annotations, Gems, and Saves on every post, we will query them in bulk or use MongoDB `$lookup` aggregation pipelines.
*   **Standardize Pagination:** 
    *   Migrate all heavy endpoints to use the optimized `StandardResultsSetPagination` from `apps.core.pagination.py` to ensure consistent and lightweight JSON payloads.
*   **Backend Filtering for Media:** 
    *   Create dedicated query filters (e.g., `?has_images=true`). Currently, the frontend requests posts and filters out those without images. If a page has mostly text posts, this causes layout bugs and wasted bandwidth.

## 2. Frontend Optimizations (Next.js & React)

Even if the backend responds instantly, the way the frontend binds massive amounts of data to the screen is causing browser lag, battery drain, and slow rendering.

### Action Items:
*   **Implement Data Virtualization (Infinite Scroll Fix):**
    *   *Problem:* The infinite scroll in `home-page` appends raw DOM elements continuously. Scrolling far down will eventually crash low-end devices due to DOM bloat.
    *   *Solution:* Implement **Windowing/Virtualization** (using `react-virtuoso` or `react-window`). This ensures that only the posts currently visible on the screen are rendered in the DOM, replacing off-screen posts with empty placeholders.
*   **Image Optimization Migration:**
    *   *Problem:* Standard `<img>` tags are being used extensively across critical UI pieces (`UserAvatar`, `PostCard`, `ExploreHeritage`), which means images are downloaded in full unoptimized sizes.
    *   *Solution:* We will migrate all standard `<img>` tags to the Next.js `<Image />` component. We will also update `next.config.ts` to allow our remote image domains. This will provide automatic WebP compression, lazy loading, and appropriate sizing for all user-generated media.
*   **Suspense Boundaries and Skeleton Loaders:**
    *   *Problem:* Client layout shifts when data finally arrives.
    *   *Solution:* Implement React `<Suspense>` boundaries and structured Skeleton loaders for posts and events. This makes the UI feel instantly responsive when changing pages and eliminates layout layout jumps.
*   **Server-Side Fetching / Caching (RSC wherever possible):**
    *   Move heavy initial data fetches to React Server Components where applicable, caching the response using Next.js data cache instead of dumping it all on client-side `useEffect` calls.

## Implementation Phases

**Phase 1: Backend Query Optimization** (1-2 days)
1. Rewrite `PostListSerializer` logic to utilize `context` caching for authors, media, and counts.
2. Introduce bulk-fetching in `posts/views.py`.
3. Standardize API pagination outputs.

**Phase 2: Frontend Media & Layout Stabilization** (1-2 days)
1. Migrate global `<img>` to `<Image />`.
2. Configure image caching in `next.config.ts`.
3. Build Skeleton UI states.

**Phase 3: Deep Frontend Optimization** (1-2 days)
1. Add `react-virtuoso` for virtualized infinite scrolling on the home feed and events feed.
2. Fix client-level data filtering by adjusting to the new backend query parameters.

---
*Please review this plan. Let me know if you approve or if you'd like to adjust focus areas, and we will begin with Phase 1.*