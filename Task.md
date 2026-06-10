# Task Checklist

## Backend Changes
- [x] New migration: Add `target` column to `notifications` table
- [x] New migration: Add `status` and `restriction_reason` columns to `posts` table
- [x] Update `Notification` model — add `target` to `$fillable`
- [x] Update `Post` model — add `status`, `restriction_reason` to `$fillable`
- [x] Create `SendSubscriptionNotificationJob`
- [x] Update `SubscriptionService` — dispatch subscription notification
- [x] Update `NotificationService` — store `target` field
- [x] Update `PostController` — add `restrict()` method
- [x] Update `api.php` routes — restrict custom push to admin, add post restrict route
- [x] Update `DashboardController` — add `total_authors`, `total_readers` stats

## Frontend Changes
- [x] Create `PostDetailPage.jsx` (full page for reading posts)
- [x] Create `EditPostPage.jsx` (edit post with jodit-react)
- [x] Update `CreatePostPage.jsx` — rename + jodit-react editor
- [x] Update `FeedPage.jsx` — remove modal, use navigate
- [x] Update `InboxPage.jsx` — navigate to post detail page
- [x] Update `PostsPage.jsx` — add edit button, admin post detail link
- [x] Update `Sidebar.jsx` — restructure nav items per role
- [x] Update `App.jsx` — new routes + role restrictions
- [x] Update `DashboardPage.jsx` — fix column names, add author/reader/post counts
- [x] Update `NotificationsPage.jsx` — fix column names, hide send tab for authors

## Verification
- [x] Run `php artisan migrate`
- [x] Verify route list

---

## Phase 2 — Bug Fixes & Feature Updates

### Author Fixes
- [x] Fix `SubscribersPage.jsx` — replace Reader ID column with #SL serial number column
- [x] Fix `EditPostPage.jsx` — change Jodit editor content text color to black (and background to white)

### Admin — Posts Read-Only + Restrict Only
- [x] Update `api.php` — move posts apiResource to `role:author` only; add GET posts listing for admin
- [x] Update `PostsPage.jsx` — hide Create button for admin; show only View action (no Edit/Delete)
- [x] Update `App.jsx` — restrict `/posts/create` and `/posts/:id/edit` to author only

### Admin — Device Token Management
- [x] Update `DeviceTokenRepositoryInterface.php` — add `paginateAll()` method
- [x] Update `DeviceTokenRepository.php` — implement `paginateAll()` with search/pagination
- [x] Update `DeviceTokenController.php` — add `index()` and `destroyById()` methods
- [x] Update `api.php` — add admin routes: `GET /device-tokens`, `DELETE /device-tokens/{id}`
- [x] Create `DeviceTokensPage.jsx` — new admin page with DataTable, search, delete
- [x] Update `App.jsx` — add `/device-tokens` route for admin
- [x] Update `Sidebar.jsx` — add "Device Tokens" nav item for admin
- [x] Update `Layout.jsx` — add page title for `/device-tokens`

### Verification
- [x] Verify author Subscribers page columns
- [x] Verify Jodit editor text color
- [x] Verify admin cannot create/edit/delete posts
- [x] Verify admin can view and delete device tokens

---

## Phase 3 — Profile updates, alert visibility, auto push permission & in-app notification system

### Database Changes
- [x] Create migration: Add `is_read` to `notification_recipients`
- [x] Run `php artisan migrate`

### Backend Changes
- [x] Update `UserRepositoryInterface.php` — add `update()` method
- [x] Update `UserRepository.php` — implement `update()`
- [x] Update `AuthService.php` — add `updateProfile()` and `updatePassword()` methods
- [x] Update `AuthController.php` — add `updateProfile()` and `updatePassword()` endpoints
- [x] Update `NotificationRecipient.php` — add `is_read` to `$fillable` and casts
- [x] Update `NotificationController.php` — add `unreadCount()` and `markAsRead()` endpoints
- [x] Update `api.php` routes — add endpoints for profile updates and unread status

### Frontend Changes
- [x] Update `App.jsx` — fix `Toaster` styles (text contrast)
- [x] Update `App.jsx` — add `/profile` route and update `/inbox` route permissions
- [x] Create `ProfilePage.jsx` — user details and security updates for all roles
- [x] Update `Sidebar.jsx` — add "Profile" navigation link
- [x] Update `Layout.jsx` — trigger auto push permission prompt on landing
- [x] Update `Layout.jsx` — replace header bell with inbox unread count badge
- [x] Update `InboxPage.jsx` — read/unread visual styles, mark-as-read, and role-based redirect
- [x] Update `usePushNotifications.jsx` — navigate to post details on foreground toast click

### Verification
- [x] Verify toast alerts are visible
- [x] Verify landing push notification request
- [x] Verify profile updates (bio, image, password)
- [x] Verify in-app notifications read/unread styles and counts

---

## Phase 3 Extension — Real-Time Inbox Update without Reload

### Frontend Changes
- [x] Update `InboxPage.jsx` — Listen to `sync-notifications` and refresh inbox list

### Verification
- [x] Verify notification list refreshes automatically without page reload when a foreground push lands

---

## Phase 3 Extension 2 — Push Notification Directly into Local State Array

### Backend Changes
- [x] Update `NotificationService.php` — include `recipient_id` and `sender_name` in custom data

### Frontend Changes
- [x] Update `usePushNotifications.jsx` — dispatch `new-inbox-notification` event
- [x] Update `InboxPage.jsx` — listen to `new-inbox-notification` and prepend state array

### Verification
- [x] Verify notification prepends to local state array without fetching API in network log
