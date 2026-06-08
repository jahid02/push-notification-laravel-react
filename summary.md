# Project Summary — AetherNotify Push Pipeline & Console

This document provides a comprehensive overview of the **AetherNotify** system, its architecture, scope, design decisions, and the full history of modifications made. It serves as context for any new agent joining the workspace.

---

## 1. 🌌 System Overview & Tech Stack
**AetherNotify** is a role-based content-sharing and FCM push notification management platform. 

* **Backend**: Laravel 11 API (`/notification-api`)
  * Local Server: `http://127.0.0.1:8000`
  * Database: MySQL (Database name: `push-notification`)
  * Auth: JWT via `jwt.auth` guards
  * Push Pipeline: Asynchronous queue-based FCM push dispatch
* **Frontend**: React SPA (`/notification-admin`)
  * Bundler: Vite (runs locally via `npm run dev`)
  * Styling: Tailwind CSS (v4) with design token overrides in `index.css`
  * Global Alerts: `react-hot-toast` with custom glass panels

---

## 2. 👥 User Roles & Access Control
The system separates permissions strictly based on user roles:
1. **Admin (`admin`)**: Access to global user directory, queue metrics, role promotion/demotion, and failed queue diagnostics (retrying/flushing failed FCM jobs).
2. **Author (`author`)**: Publish posts, check subscribers, dispatch custom notification campaigns to custom targets (All, Subscribed readers, or Specific selected users).
3. **Reader (`reader`)**: Browse authors directory, subscribe/unsubscribe, browse published posts, and view delivered push notification logs (Inbox).

---

## 3. 📂 Core Database Schema & Relations
* **`users`**: Contains credentials, user roles (`admin`, `author`, `reader`), avatars, and biography descriptions.
* **`posts`**: Written by authors. Has `title`, `body`, `image_url`, and `published_at` fields.
* **`device_tokens`**: Stores FCM tokens linked to users.
* **`subscriptions`**: Many-to-many relationship mapping `reader_id` to `author_id`.
* **`notifications`**: Log records of broadcast campaigns containing campaign subject, body, target filters, and delivery metrics.
* **`notification_recipients`**: Tracks individual per-device delivery statuses (`pending`, `sent`, `failed`, `error_message`).

---

## 4. 🛠️ Key Improvements & Features Added

### 🔑 A. Premium Auth Portal Redesign
* **Ambient Mesh Backdrop**: Refactored `LoginPage` and `RegisterPage` to include dual glowing neon lights (indigo/teal) under a fine geometric grid overlay.
* **Sleek Spacing & height**: Fixed spacing overlaps between icons and input placeholders by applying standard padding overrides (`py-3.5`, `!ml-3.5`, `!p-[20px]`).

### 🧑‍🤝‍🧑 B. Authors Directory & Subscriptions (Reader)
* **API Extension**: Created GET `/api/authors` to list author accounts, avoiding the 403 authorization guard on `/api/users`.
* **Database Enhancement**: Eagerly queries `withCount('subscribers')` inside the `UserRepository` so readers see live follower stats.
* **Frontend page (`AuthorsPage.jsx`)**: Responsive card catalog displaying initials avatars, channel subscriber metrics, biographies, and async toggle buttons (Subscribe/Unsubscribe) with state loaders.

### 📖 C. Reader Feed & Modal Viewer
* **API Extension**: Created GET `/api/feed` (supports followed channels filtering and text search) and exposed GET `/api/posts/{id}` to authenticated readers.
* **Frontend page (`FeedPage.jsx`)**: Grid layout displaying article cards. Tapping "Read Post" opens an immersive overlay glass modal rendering the full post text, publisher info, and cover image.

### 🔔 D. Received Notification Inbox & Cross-Navigation
* **API Extension**: Created GET `/api/notifications/inbox` retrieving user-specific logs from `notification_recipients`.
* **Frontend page (`InboxPage.jsx`)**: Inbox log displaying received pushes.
* **Cross-Navigation Linkage**: If a notification has an attached `post_id`, clicking the notification redirects the user to `/feed` with navigation states, automatically opening the Post Reader Modal for immediate reading.

---

## 5. 🔗 Workspace File Mapping
* **Backend Routes**: [api.php](file:///d:/my%20project/test-notification/notification-api/routes/api.php)
* **Controllers**: 
  * [PostController.php](file:///d:/my%20project/test-notification/notification-api/app/Http/Controllers/PostController.php)
  * [NotificationController.php](file:///d:/my%20project/test-notification/notification-api/app/Http/Controllers/NotificationController.php)
* **Frontend Routes**: [App.jsx](file:///d:/my%20project/test-notification/notification-admin/src/App.jsx)
* **Sidebar Menu**: [Sidebar.jsx](file:///d:/my%20project/test-notification/notification-admin/src/components/Sidebar.jsx)
* **New Pages**:
  * [AuthorsPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/AuthorsPage.jsx)
  * [FeedPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/FeedPage.jsx)
  * [InboxPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/InboxPage.jsx)
