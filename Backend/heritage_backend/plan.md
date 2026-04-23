# Implementation Plan

This plan covers the backend work for moderation, thematic groups, badge requests, and the frontend notification integration. I will keep the changes modular by separating business logic into focused app modules and small service layers instead of putting everything into one view file.

## 1. Backend: Moderation and user controls
- Add moderator-only endpoints to ban and suspend users.
- Add moderator-only endpoints to edit user roles.
- Reuse the existing `users` app for role checks and account status, instead of creating duplicate auth logic.
- Add permission helpers for moderator/admin access where needed.

## 2. Backend: Thematic groups / communities / guilds
- Create a dedicated backend module for thematic groups with its own models, serializers, views, and URLs.
- Add group data fields for name, category, description, profile picture, banner image, admin, member count, and post count.
- Add membership models for join requests, accepted members, invites, and leave actions.
- Add endpoints for:
- create group
- edit group
- list groups
- group details
- request to join
- approve / reject join requests
- invite a user
- accept / refuse invitation
- list members
- leave group
- Add business rules so only the group admin can validate membership requests and invitations.
- Keep the frontend out of this task except for the existing navigation entry that will later point to the backend-backed section.

## 3. Backend: Group posts and visibility rules
- Extend the post model or add a group-post relation so a post can belong to a specific group.
- Support public posts that can optionally be shared into a group.
- Support group-only posts that never appear on the home feed.
- Keep text-only posts group-private when required by the product rules.
- Preserve likes, saves, comments, annotations, and reports on group posts.
- Enforce access control so users who leave a group cannot open private group content they no longer have permission to see.
- Keep historical saved/liked items visible in the profile as unavailable when the content is no longer accessible.

## 4. Backend: Reports and notifications
- Keep reports routed to moderators/admins only.
- Make sure reports work for group posts as well as home posts.
- Extend the notification registry so group invites, join approvals, reports, badge requests, and moderation actions can generate notifications.
- Keep the existing notifications API and align any new event types with it.

## 5. Backend: Badge requests
- Add badge request endpoints for document upload.
- Store badge request metadata and uploaded files in a dedicated module.
- Trigger an email to moderators when a request is created.
- Add moderator approve / deny endpoints for badge requests.
-the document must be present to moderator in the email 
## 6. Frontend: Notifications integration
- Replace the static notification panel with backend-driven polling.
- Make the notification UI fit the site design and work from the home page.
- Render notifications in a Facebook-like format with a small profile picture, actor name, action text, timestamp, and unread styling.
- Connect the sidebar notification icon and the home page entry point to the same panel.
- Use the existing backend notification endpoints for list, unread count, and mark-as-read actions.
- Keep the implementation modular by moving notification fetching and transformation into a small frontend helper if needed.

## 7. Validation
- Add or update tests for moderator permissions, group membership access rules, notification serialization, and badge request flow.
- Verify that public posts, group-only posts, and saved/liked content behave correctly after leaving a group.

## Assumptions
- I will not build the frontend for thematic groups unless you ask for it later.
- I will keep the implementation inside the current backend/frontend structure instead of introducing a rewrite.
- If the current post model needs a small refactor to support group visibility cleanly, I will keep it minimal and backwards-compatible where possible.
