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
