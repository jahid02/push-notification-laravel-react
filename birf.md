# Implementation Plan — Phase 3 Extension 2: Push Notification Directly into Local State Array

This plan details how to push a new incoming notification directly into the React state array in `InboxPage.jsx` when a foreground notification is received, avoiding any full-list API refetch or reload.

---

## Proposed Changes

### Backend Changes

#### [MODIFY] [NotificationService.php](file:///d:/my%20project/test-notification/notification-api/app/Services/NotificationService.php)
- Update `sendNotificationToUsers()` to include the exact `recipient_id` (representing the `notification_recipients` database row ID) and the `sender_name` in the FCM `customData` payload.
- This allows the frontend to have access to the primary key of the recipient log for mark-as-read operations.

---

### Frontend Changes

#### [MODIFY] [usePushNotifications.jsx](file:///d:/my%20project/test-notification/notification-admin/src/hooks/usePushNotifications.jsx)
- In the foreground `onMessage` listener, construct a full `recipientRecord` object matching the database schema using keys from the FCM payload (`recipient_id`, `sender_name`, `title`, `body`, `post_id`).
- Dispatch a new custom event: `window.dispatchEvent(new CustomEvent('new-inbox-notification', { detail: newRecord }));`.

#### [MODIFY] [InboxPage.jsx](file:///d:/my%20project/test-notification/notification-admin/src/pages/InboxPage.jsx)
- Replace the `'sync-notifications'` event listener that triggered `fetchNotifications()` with a listener for `'new-inbox-notification'`.
- Inside the handler, prepend the new notification object directly to the local `notifications` state array:
  `setNotifications(prev => [newRecord, ...prev]);`
- This puts the notification at the top of the array instantly without calling the backend API to reload/refetch the list.

---

## Verification Plan

### Manual Verification
1. Open the `/inbox` page as a Reader.
2. Publish a new post as an Author from a separate browser/session.
3. Verify that:
   - The notification is pushed instantly to the top of the list in `InboxPage`.
   - No network request for `/api/notifications/inbox` is triggered (verify via Chrome DevTools Network tab).
   - Clicking on the newly prepended notification correctly sends the mark-as-read API request and redirects the reader to the post details page.
