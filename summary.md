# Project Summary — AetherNotify Push Pipeline & Console

This document provides a comprehensive overview of the **AetherNotify** system, its architecture, scope, design decisions, and the full history of modifications made. It serves as context for any new agent joining the workspace.

---

## 1. 🌌 System Overview & Tech Stack
**AetherNotify** is a role-based content-sharing and FCM push notification management platform. 

* **Backend**: Laravel 11 API (`/notification-api`)
  * Local Server: `http://127.0.0.1:8000`
  * Database: MySQL (Database name: `push-notification`)
  * Auth: JWT via `jwt.auth` guards, supporting sliding-window token refresh
  * Push Pipeline: Asynchronous queue-based FCM push dispatch
* **Frontend**: React SPA (`/notification-admin`)
  * Bundler: Vite (runs locally via `npm run dev`)
  * Styling: Tailwind CSS (v4) with design token overrides in `index.css`
  * Global Alerts: `react-hot-toast` (customized to light glass theme for contrast)

---

## 2. 👥 User Roles & Access Control
The system separates permissions strictly based on user roles:
1. **Admin (`admin`)**: Access to global user directory, queue metrics, role promotion/demotion, failed queue diagnostics (retrying/flushing failed FCM jobs), registered device token monitoring and removal, and post restriction control. Admin has read-only access to posts and cannot create/edit them.
2. **Author (`author`)**: Publish posts, manage own posts, view channel subscribers list, and dispatch custom notification campaigns to custom targets (All, Subscribed readers, or Specific selected users).
3. **Reader (`reader`)**: Browse authors directory, subscribe/unsubscribe, browse published posts, receive push notifications, view delivered push notification logs (Inbox), and mark notifications as read.

---

## 3. 📂 Core Database Schema & Relations
* **`users`**: Contains credentials, user roles (`admin`, `author`, `reader`), avatars, and biography descriptions.
* **`posts`**: Written by authors. Has `title`, `body`, `image_url`, `status` (`active` or `restricted`), `restriction_reason`, and `published_at` fields.
* **`device_tokens`**: Stores FCM tokens linked to users and platform info.
* **`subscriptions`**: Many-to-many relationship mapping `reader_id` to `author_id`.
* **`notifications`**: Log records of broadcast campaigns containing campaign subject, body, target filters, and delivery metrics.
* **`notification_recipients`**: Tracks individual per-device delivery statuses (`pending`, `sent`, `failed`, `error_message`) and read status (`is_read` boolean).

---

## 4. 🛠️ Key Improvements & Features Added (Phases 1-3 & Extensions)

### 🧑‍💼 A. Profile Page & Accounts
* **Frontend (`ProfilePage.jsx`)**: New profile interface for all roles featuring Name and Bio edits, Avatar image upload (supports instant preview and uploads saved to `public/uploads/avatars` in the backend), and Password changes (validating current vs. new passwords).
* **Auth Context Integration**: Added `updateUser` to `AuthContext.jsx` to dynamically update user info across headers and sidebars without page refresh.

### 🔔 B. In-App Notification System & Real-Time Inbox
* **FCM landing auto-prompt**: Prompts user subscription permission automatically on landing/login (if status is default) instead of waiting for a manual click.
* **Unread Counts & Badges**: Added an inbox bell icon to the top header displaying a red unread count badge. The count is fetched on landing, polled every 30 seconds, and updated immediately when new pushes arrive.
* **Read/Unread Inbox Styling (`InboxPage.jsx`)**: Displays unread notifications with a glowing background (`bg-accent-primary-glow/5`), accent left border, bold text, and a glowing unread dot. Read items are displayed in default styling.
* **Mark-as-read**: Clicking an inbox item sends an API request to mark it read, decrements the header badge count, and redirects the user (readers navigate to `/feed/{id}`, staff roles navigate to `/posts/{id}`).
* **Real-time Refresh Extension**: Integrated a `'sync-notifications'` custom event listener in `InboxPage.jsx`. When a foreground push notification arrives via FCM `onMessage`, it dispatches this event to automatically reload and prepend new notifications to the top of the list in real-time, without requiring a page reload.

### 🔑 C. Access Token & Refresh Token Sliding Window
* **Backend**: The refresh endpoint `/api/auth/refresh` generates and returns a brand-new `refresh_token` alongside the `access_token` to maintain sliding window sessions.
* **Frontend Interceptor (`src/api/axios.js`)**: Configured Axios response interceptors to catch `401` errors, fetch new token pairs using the refresh token, queue concurrent requests, and retry the original failed requests seamlessly.

### ⚙️ D. Administrative & UI Enhancements (Phase 2)
* **Serial Numbers**: Replaced database primary IDs with computed table serial numbers (`#SL`) based on current pagination offsets on all datatables.
* **Editor Fix**: Styled the Jodit editor text color to black and background to white on the Edit Post page to ensure readability.
* **Device Token Manager**: Admin-only page displaying all active device tokens with options to search and remove device tokens from the system.
* **Admin Post Control**: Blocked Admin from creating or editing posts. Admin is now read-only and restricted to marking posts as active/restricted with reasoning.

---

## 5. 🔗 Workspace File Mapping
* **Backend Routes**: [api.php](file:///d:/my%20project/test-notification/notification-api/routes/api.php)
* **Controllers**: 
  * [AuthController.php](file:///d:/my%20project/test-notification/notification-api/app/Http/Controllers/AuthController.php)
  * [PostController.php](file:///d:/my%20project/test-notification/notification-api/app/Http/Controllers/PostController.php)
  * [NotificationController.php](file:///d:/my%20project/test-notification/notification-api/app/Http/Controllers/NotificationController.php)
  * [DeviceTokenController.php](file:///d:/my%20project/test-notification/notification-api/app/Http/Controllers/DeviceTokenController.php)
* **Frontend Routes**: [App.jsx](file:///d:/my%20project/test-notification/notification-admin/src/App.jsx)
* **Sidebar Menu**: [Sidebar.jsx](file:///d:/my%20project/test-notification/notification-admin/src/components/Sidebar.jsx)
* **Layout Layout**: [Layout.jsx](file:///d:/my%20project/test-notification/notification-admin/src/components/Layout.jsx)
* **Axios Client**: [axios.js](file:///d:/my%20project/test-notification/notification-admin/src/api/axios.js)
* **Key Page Views**:
  * [ProfilePage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/ProfilePage.jsx)
  * [InboxPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/InboxPage.jsx)
  * [DeviceTokensPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/DeviceTokensPage.jsx)
  * [FeedPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/FeedPage.jsx)
  * [AuthorsPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/AuthorsPage.jsx)
  * [PostsPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/PostsPage.jsx)
