# In-App Notification — Data Flow Diagram

This document visualizes how **In-App (Database) Notifications** are created, stored, delivered in real-time, displayed in the inbox, and marked as read — mapping each step to the exact **filename** and **method name** responsible.

---

## 1. High-Level Flow Overview

```mermaid
graph TD
    classDef backend fill:#1e293b,stroke:#6366f1,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef frontend fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef external fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef db fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef event fill:#1e293b,stroke:#ec4899,stroke-width:2px,color:#e2e8f0,font-weight:bold

    subgraph WRITE["✏️ In-App Record Creation (Backend)"]
        NS["NotificationService.php<br/>sendNotificationToUsers()"]:::backend
        NR["NotificationRepository.php<br/>createRecipients()"]:::backend
        DB[("MySQL Database<br/>notification_recipients table")]:::db
    end

    subgraph REALTIME["⚡ Real-Time Frontend Delivery"]
        GOOGLE["Google FCM v1 API"]:::external
        HOOK["usePushNotifications.jsx<br/>onMessage() listener"]:::frontend
        EVT1["CustomEvent<br/>'new-inbox-notification'"]:::event
        EVT2["Event<br/>'sync-notifications'"]:::event
        TOAST["usePushNotifications.jsx<br/>toast.custom()"]:::frontend
    end

    subgraph DISPLAY["📥 Inbox Display"]
        INBOX["InboxPage.jsx<br/>fetchNotifications()"]:::frontend
        API_INBOX["NotificationController.php<br/>inbox()"]:::backend
        PREPEND["InboxPage.jsx<br/>handleNewNotification()"]:::frontend
    end

    subgraph BADGE["🔔 Unread Badge"]
        LAYOUT["Layout.jsx<br/>fetchUnreadCount()"]:::frontend
        API_COUNT["NotificationController.php<br/>unreadCount()"]:::backend
    end

    subgraph READ["✅ Mark as Read"]
        CLICK["InboxPage.jsx<br/>handleNotificationClick()"]:::frontend
        API_READ["NotificationController.php<br/>markAsRead()"]:::backend
    end

    %% Writing flow
    NS -->|"bulk insert"| NR
    NR --> DB

    %% Real-time delivery
    GOOGLE -.->|"foreground push"| HOOK
    HOOK -->|"dispatch"| EVT1
    HOOK -->|"dispatch"| EVT2
    HOOK --> TOAST

    %% Inbox display
    EVT1 --> PREPEND
    PREPEND -->|"prepend to state"| INBOX
    INBOX -->|"GET /api/notifications/inbox"| API_INBOX
    API_INBOX --> DB

    %% Badge sync
    EVT2 --> LAYOUT
    LAYOUT -->|"GET /api/notifications/unread-count"| API_COUNT
    API_COUNT --> DB

    %% Mark as read
    CLICK -->|"POST /api/notifications/recipients/{id}/read"| API_READ
    API_READ --> DB
    CLICK -->|"dispatch"| EVT2
```

---

## 2. Sequence Diagram — In-App Record Creation

This shows how `notification_recipients` records (the in-app notification log) are created during the push dispatch pipeline.

```mermaid
sequenceDiagram
    autonumber
    participant JOB as Queue Job<br/>(SendPostNotificationJob / SendCustomNotificationJob)
    participant NS as NotificationService.php<br/>(dispatchPostNotification / sendNotificationToUsers)
    participant NR as NotificationRepository.php<br/>(create / createRecipients)
    participant DB as MySQL Database

    JOB->>NS: dispatchPostNotification($post) / sendNotificationToUsers(...)
    
    NS->>NR: create() — Insert main `notifications` record
    NR->>DB: INSERT INTO notifications (sender_id, post_id, title, body, status='pending')
    DB-->>NR: Notification model (id)
    NR-->>NS: $notification

    Note over NS: Query DeviceToken model<br/>chunk(200) to prevent memory overflow

    loop For each chunk of 200 device tokens
        NS->>NR: createRecipients($recipientsData)
        Note over NR: $recipientsData = [{notification_id, user_id,<br/>device_token_id, status='pending'}, ...]
        NR->>DB: INSERT INTO notification_recipients (bulk)
    end

    Note over NS: These `notification_recipients` rows<br/>ARE the in-app notification records.<br/>Each row = one in-app notification for one user.

    loop For each recipient (chunk 100)
        NS->>DB: UPDATE notification_recipients SET status='sent', sent_at=now()
        NS->>NR: incrementCounter(notification_id, 'success_count')
    end

    NS->>DB: UPDATE notifications SET status = 'completed'
```

---

## 3. Sequence Diagram — Real-Time Foreground Delivery & UI Prepend

When a push notification arrives while the user has the app open, this flow handles **instant in-app display** without page reload.

```mermaid
sequenceDiagram
    autonumber
    participant GOOGLE as Google FCM Service
    participant FB as firebase.js<br/>(messaging instance)
    participant HOOK as usePushNotifications.jsx<br/>(onMessage listener)
    participant EVT as Window Events
    participant INBOX as InboxPage.jsx<br/>(handleNewNotification)
    participant LAYOUT as Layout.jsx<br/>(fetchUnreadCount)
    participant TOAST as Toast Banner<br/>(react-hot-toast)
    participant API as NotificationController.php<br/>(unreadCount)

    GOOGLE->>FB: Deliver foreground FCM payload
    FB->>HOOK: onMessage(messaging, callback)
    activate HOOK

    Note over HOOK: Build newRecord from payload:
    Note over HOOK: {<br/>  id: payload.data.recipient_id,<br/>  is_read: false,<br/>  created_at: new Date().toISOString(),<br/>  notification: {<br/>    title: payload.notification.title,<br/>    body: payload.notification.body,<br/>    image_url: payload.data.image_url,<br/>    post_id: payload.data.post_id,<br/>    sender: { name: payload.data.sender_name }<br/>  }<br/>}

    HOOK->>EVT: window.dispatchEvent(new CustomEvent('new-inbox-notification', { detail: newRecord }))
    HOOK->>EVT: window.dispatchEvent(new Event('sync-notifications'))
    HOOK->>TOAST: toast.custom() — render glassmorphic notification toast

    deactivate HOOK

    EVT->>INBOX: CustomEvent 'new-inbox-notification' received
    activate INBOX
    Note over INBOX: handleNewNotification(e):<br/>setNotifications(prev => [e.detail, ...prev])
    Note over INBOX: Prepend newRecord to state array<br/>No API call — instant render
    Note over INBOX: getInitials(senderName) → avatar initials
    deactivate INBOX

    EVT->>LAYOUT: Event 'sync-notifications' received
    activate LAYOUT
    LAYOUT->>API: GET /api/notifications/unread-count
    API-->>LAYOUT: { unread_count: N }
    Note over LAYOUT: setUnreadCount(N)<br/>Update red badge on bell icon 🔔
    deactivate LAYOUT
```

---

## 4. Sequence Diagram — Inbox Page Load (API Fetch)

When a user navigates to the `/inbox` page, notifications are fetched from the database.

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant INBOX as InboxPage.jsx<br/>(fetchNotifications)
    participant AX as axios.js<br/>(GET request)
    participant NC as NotificationController.php<br/>(inbox)
    participant NR_MODEL as NotificationRecipient Model<br/>(with notification.sender, notification.post)
    participant DB as MySQL Database

    User->>INBOX: Navigate to /inbox
    activate INBOX
    INBOX->>INBOX: setLoading(true)

    INBOX->>AX: api.get('/notifications/inbox', { page, per_page: 15 })
    AX->>NC: GET /api/notifications/inbox

    NC->>NR_MODEL: NotificationRecipient::with(['notification.sender', 'notification.post'])
    NC->>NR_MODEL: →where('user_id', $user→id)→latest()→paginate(15)
    NR_MODEL->>DB: SELECT with JOINs
    DB-->>NR_MODEL: Paginated result set
    NR_MODEL-->>NC: LengthAwarePaginator

    NC-->>AX: JSON { success: true, data: { data: [...], current_page, last_page, total } }
    AX-->>INBOX: response.data

    INBOX->>INBOX: setNotifications(payload.data)
    INBOX->>INBOX: setCurrentPage / setTotalPages / setTotalItems
    INBOX->>INBOX: setLoading(false)

    Note over INBOX: Render notification list:<br/>• getInitials(sender.name) → avatar circle<br/>• isUnread styling (glow bg + bold + pulse dot)<br/>• "Article Attached" badge if post_id exists
    deactivate INBOX
```

---

## 5. Sequence Diagram — Mark as Read

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Browser)
    participant INBOX as InboxPage.jsx<br/>(handleNotificationClick)
    participant AX as axios.js<br/>(POST request)
    participant NC as NotificationController.php<br/>(markAsRead)
    participant NR_MODEL as NotificationRecipient Model
    participant DB as MySQL Database
    participant LAYOUT as Layout.jsx<br/>(fetchUnreadCount)

    User->>INBOX: Click on unread notification item
    activate INBOX

    alt Notification is unread (is_read === false)
        INBOX->>AX: api.post('/notifications/recipients/{id}/read')
        AX->>NC: POST /api/notifications/recipients/{id}/read
        NC->>NR_MODEL: NotificationRecipient::where('id', $id)→where('user_id', $userId)→firstOrFail()
        NR_MODEL->>DB: SELECT ... WHERE id = ? AND user_id = ?
        NC->>NR_MODEL: $recipient→update(['is_read' => true])
        NR_MODEL->>DB: UPDATE notification_recipients SET is_read = 1
        NC-->>AX: { success: true, message: "Notification marked as read." }

        INBOX->>INBOX: setNotifications(prev =><br/>  prev.map(n => n.id === id ? {...n, is_read: true} : n))
        INBOX->>LAYOUT: window.dispatchEvent(new Event('sync-notifications'))
        LAYOUT->>NC: GET /api/notifications/unread-count
        NC-->>LAYOUT: { unread_count: N-1 }
        Note over LAYOUT: Badge count decremented 🔔
    end

    alt notification.post_id exists
        alt user.role === 'reader'
            INBOX->>User: navigate('/feed/{post_id}')
        else author / admin
            INBOX->>User: navigate('/posts/{post_id}')
        end
    else No post attached
        INBOX->>User: toast.success('System broadcast read.')
    end

    deactivate INBOX
```

---

## 6. Sequence Diagram — Unread Badge Polling & Sync

```mermaid
sequenceDiagram
    autonumber
    participant LAYOUT as Layout.jsx<br/>(fetchUnreadCount)
    participant AX as axios.js
    participant NC as NotificationController.php<br/>(unreadCount)
    participant NR_MODEL as NotificationRecipient Model
    participant DB as MySQL Database

    Note over LAYOUT: On mount & every 30 seconds (setInterval)
    loop Every 30 seconds
        LAYOUT->>AX: api.get('/notifications/unread-count')
        AX->>NC: GET /api/notifications/unread-count
        NC->>NR_MODEL: NotificationRecipient::where('user_id', $userId)→where('is_read', false)→count()
        NR_MODEL->>DB: SELECT COUNT(*) FROM notification_recipients WHERE user_id=? AND is_read=0
        DB-->>NR_MODEL: count
        NC-->>LAYOUT: { unread_count: N }
        LAYOUT->>LAYOUT: setUnreadCount(N)
    end

    Note over LAYOUT: Also triggered by 'sync-notifications' event<br/>(from usePushNotifications.jsx or InboxPage.jsx)
```

---

## 7. File & Method Reference Table

### Backend — `notification-api/`

| # | File Path | Method | In-App Role |
|---|-----------|--------|-------------|
| 1 | `app/Services/NotificationService.php` | `sendNotificationToUsers()` | Creates `notification_recipients` records — **these ARE the in-app notifications** |
| 2 | `app/Repositories/NotificationRepository.php` | `create()` | Inserts parent `notifications` record (campaign-level) |
| 3 | `app/Repositories/NotificationRepository.php` | `createRecipients()` | Bulk-inserts `notification_recipients` rows (per-user in-app records) |
| 4 | `app/Repositories/NotificationRepository.php` | `incrementCounter()` | Atomically updates `success_count` / `failure_count` on parent |
| 5 | `app/Http/Controllers/NotificationController.php` | `inbox()` | Returns paginated inbox: queries `notification_recipients` with `notification.sender` & `notification.post` |
| 6 | `app/Http/Controllers/NotificationController.php` | `unreadCount()` | Returns count of unread `notification_recipients` for current user |
| 7 | `app/Http/Controllers/NotificationController.php` | `markAsRead()` | Sets `is_read = true` on a specific `notification_recipients` row |
| 8 | `app/Models/NotificationRecipient.php` | — (Model) | Eloquent model for `notification_recipients` table with relationships |
| 9 | `app/Models/Notification.php` | — (Model) | Eloquent model for `notifications` table (parent campaign record) |

### Frontend — `notification-admin/src/`

| # | File Path | Method / Handler | In-App Role |
|---|-----------|------------------|-------------|
| 1 | `hooks/usePushNotifications.jsx` | `onMessage()` listener | Intercepts foreground FCM push, constructs `newRecord` matching inbox API shape |
| 2 | `hooks/usePushNotifications.jsx` | `window.dispatchEvent('new-inbox-notification')` | Dispatches CustomEvent carrying `newRecord` to prepend into inbox |
| 3 | `hooks/usePushNotifications.jsx` | `window.dispatchEvent('sync-notifications')` | Triggers badge count refresh in Layout |
| 4 | `hooks/usePushNotifications.jsx` | `toast.custom()` | Renders clickable glassmorphic toast with navigate-on-click |
| 5 | `pages/InboxPage.jsx` | `fetchNotifications()` | Loads paginated inbox via `GET /api/notifications/inbox` |
| 6 | `pages/InboxPage.jsx` | `handleNewNotification()` | Listens for `'new-inbox-notification'` event, prepends to state array |
| 7 | `pages/InboxPage.jsx` | `handleNotificationClick()` | Marks notification as read via API, updates local state, syncs badge, navigates |
| 8 | `pages/InboxPage.jsx` | `getInitials()` | Computes avatar initials from sender name |
| 9 | `components/Layout.jsx` | `fetchUnreadCount()` | Fetches unread count via `GET /api/notifications/unread-count` |
| 10 | `components/Layout.jsx` | `setInterval(fetchUnreadCount, 30000)` | Polls unread count every 30 seconds |
| 11 | `components/Layout.jsx` | `addEventListener('sync-notifications')` | Re-fetches unread count on event |

### API Routes — `routes/api.php`

| Route | Method | Controller → Action | Purpose |
|-------|--------|---------------------|---------|
| `GET /api/notifications/inbox` | GET | `NotificationController@inbox` | Fetch user's in-app notification list |
| `GET /api/notifications/unread-count` | GET | `NotificationController@unreadCount` | Get unread notification count |
| `POST /api/notifications/recipients/{id}/read` | POST | `NotificationController@markAsRead` | Mark single notification as read |

---

## 8. Database Schema — In-App Notification Tables

```mermaid
erDiagram
    notifications ||--o{ notification_recipients : "notification_id"
    notification_recipients }o--|| users : "user_id"
    notification_recipients }o--|| device_tokens : "device_token_id"
    notifications }o--|| users : "sender_id"
    notifications }o--o| posts : "post_id"

    notifications {
        int id PK
        int sender_id FK
        int post_id FK
        string title
        text body
        string image_url
        string target
        string status
        int success_count
        int failure_count
        timestamp created_at
    }

    notification_recipients {
        int id PK
        int notification_id FK
        int user_id FK
        int device_token_id FK
        string status
        string fcm_message_id
        string error_message
        boolean is_read
        timestamp sent_at
        timestamp created_at
    }
```

> **Key Insight**: The `notification_recipients` table serves a **dual purpose** — it tracks FCM push delivery status (status, fcm_message_id, error_message) AND functions as the in-app notification inbox (is_read, user_id). Each row in this table represents one in-app notification for one user.

---

## 9. Custom Event Communication Map

```mermaid
graph LR
    classDef hook fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#e2e8f0
    classDef page fill:#1e293b,stroke:#6366f1,stroke-width:2px,color:#e2e8f0
    classDef event fill:#0f172a,stroke:#ec4899,stroke-width:2px,color:#f9a8d4,font-style:italic

    HOOK["usePushNotifications.jsx<br/>onMessage() listener"]:::hook
    INBOX_CLICK["InboxPage.jsx<br/>handleNotificationClick()"]:::page

    EVT1["CustomEvent<br/>'new-inbox-notification'"]:::event
    EVT2["Event<br/>'sync-notifications'"]:::event

    INBOX_LISTEN["InboxPage.jsx<br/>handleNewNotification()"]:::page
    LAYOUT_LISTEN["Layout.jsx<br/>fetchUnreadCount()"]:::page

    HOOK -->|"dispatches"| EVT1
    HOOK -->|"dispatches"| EVT2
    INBOX_CLICK -->|"dispatches"| EVT2

    EVT1 -->|"listened by"| INBOX_LISTEN
    EVT2 -->|"listened by"| LAYOUT_LISTEN
```

| Event Name | Dispatched By | Listened By | Purpose |
|-----------|---------------|-------------|---------|
| `new-inbox-notification` | `usePushNotifications.jsx` → `onMessage()` | `InboxPage.jsx` → `handleNewNotification()` | Prepend new notification to inbox state in real-time |
| `sync-notifications` | `usePushNotifications.jsx` → `onMessage()` AND `InboxPage.jsx` → `handleNotificationClick()` | `Layout.jsx` → `fetchUnreadCount()` | Refresh unread badge count in header |
