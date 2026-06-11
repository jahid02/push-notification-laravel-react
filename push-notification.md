# Push Notification — Data Flow Diagram

This document visualizes how **Push Notifications** (via Google FCM v1) flow through the system, mapping each step to the exact **filename** and **method name** responsible.

---

## 1. High-Level Flow Overview

```mermaid
graph TD
    classDef backend fill:#1e293b,stroke:#6366f1,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef frontend fill:#1e293b,stroke:#10b981,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef external fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef db fill:#1e293b,stroke:#3b82f6,stroke-width:2px,color:#e2e8f0,font-weight:bold
    classDef data fill:#0f172a,stroke:#64748b,stroke-width:1px,color:#94a3b8,font-style:italic

    %% ===== TRIGGER PATHS =====
    subgraph TRIGGER["🔥 Trigger Sources"]
        T1["PostController.php<br/>store()"]:::backend
        T2["NotificationController.php<br/>store()"]:::backend
        T3["SubscriptionController.php<br/>subscribe()"]:::backend
    end

    %% ===== SERVICE LAYER =====
    subgraph SERVICE["⚙️ Service Layer"]
        S1["PostService.php<br/>createPost()"]:::backend
        S2["NotificationService.php<br/>createCustomNotification()"]:::backend
        S3["SubscriptionService.php<br/>subscribe()"]:::backend
    end

    %% ===== QUEUE LAYER =====
    subgraph QUEUE["📦 Queue Jobs (Async)"]
        J1["SendPostNotificationJob.php<br/>handle()"]:::backend
        J2["SendCustomNotificationJob.php<br/>handle()"]:::backend
        J3["SendSubscriptionNotificationJob.php<br/>handle()"]:::backend
    end

    %% ===== DISPATCH ENGINE =====
    subgraph DISPATCH["🚀 Dispatch Engine"]
        NS1["NotificationService.php<br/>dispatchPostNotification()"]:::backend
        NS2["NotificationService.php<br/>sendNotificationToUsers()"]:::backend
    end

    %% ===== REPOSITORY & DB =====
    subgraph REPO["🗄️ Repository & Database"]
        NR["NotificationRepository.php<br/>create() / createRecipients() / incrementCounter()"]:::db
        SR["SubscriptionRepository.php<br/>getSubscriberIds()"]:::db
        DTR["DeviceTokenRepository.php<br/>deleteByToken()"]:::db
        DB[("MySQL Database<br/>notifications & notification_recipients")]:::db
    end

    %% ===== FCM =====
    subgraph FCM_LAYER["📡 FCM Delivery"]
        FCM["FcmService.php<br/>sendNotification()"]:::backend
        OAUTH["FcmService.php<br/>getAccessToken()"]:::backend
        GOOGLE["Google FCM v1 API<br/>POST /v1/projects/{id}/messages:send"]:::external
    end

    %% ===== FRONTEND =====
    subgraph FRONTEND["🖥️ React Frontend — Push Reception"]
        FB["firebase.js<br/>getMessaging()"]:::frontend
        HOOK["usePushNotifications.jsx<br/>onMessage() listener"]:::frontend
        TOAST["usePushNotifications.jsx<br/>toast.custom() — glassmorphic toast"]:::frontend
    end

    %% ===== CONNECTIONS =====
    T1 --> S1
    T2 --> S2
    T3 --> S3

    S1 -->|"dispatch()"| J1
    S2 -->|"dispatch()"| J2
    S3 -->|"dispatch()"| J3

    J1 -->|"eager loads 'author'"| NS1
    J2 -->|"resolves target users"| NS2
    J3 -->|"direct FCM call"| FCM

    NS1 --> NR
    NS1 --> SR
    NS1 --> NS2

    NS2 --> NR
    NS2 -->|"per recipient loop"| FCM

    FCM --> OAUTH
    OAUTH --> GOOGLE
    GOOGLE -->|"success/failure"| FCM

    FCM -->|"on stale token"| DTR
    NR --> DB

    GOOGLE -.->|"FCM Push Delivery"| FB
    FB --> HOOK
    HOOK --> TOAST
```

---

## 2. Detailed Sequence Diagram — Post-Triggered Push

```mermaid
sequenceDiagram
    autonumber
    actor Author as Author (Browser)
    participant PC as PostController.php<br/>(store)
    participant PS as PostService.php<br/>(createPost)
    participant JOB as SendPostNotificationJob.php<br/>(handle)
    participant NS as NotificationService.php<br/>(dispatchPostNotification)
    participant NS2 as NotificationService.php<br/>(sendNotificationToUsers)
    participant SR as SubscriptionRepository.php<br/>(getSubscriberIds)
    participant NR as NotificationRepository.php<br/>(create / createRecipients)
    participant FCM as FcmService.php<br/>(sendNotification)
    participant OAUTH as FcmService.php<br/>(getAccessToken)
    participant GOOGLE as Google FCM v1 API
    participant DB as MySQL Database
    actor Reader as Reader (Browser)

    Author->>PC: POST /api/posts {title, body, image_url}
    PC->>PS: createPost($author, $data)
    PS->>DB: Insert into `posts` table
    PS->>JOB: SendPostNotificationJob::dispatch($post)
    PC-->>Author: HTTP 201 — Post created

    Note over JOB: ⏳ Runs asynchronously in Queue Worker
    activate JOB
    JOB->>JOB: $post→loadMissing('author')
    JOB->>NS: dispatchPostNotification($post)

    NS->>NR: create() → Insert `notifications` record (status=pending)
    NR->>DB: INSERT INTO notifications

    NS->>SR: getSubscriberIds($post→author_id)
    SR->>DB: SELECT reader_id FROM subscriptions
    SR-->>NS: Collection of subscriber user IDs

    NS->>NS2: sendNotificationToUsers($notification, $subscriberIds)

    NS2->>DB: UPDATE notifications SET status = 'processing'
    NS2->>NR: createRecipients() → Bulk insert pending recipients
    NR->>DB: INSERT INTO notification_recipients (chunked, 200/batch)

    loop For each recipient (chunked 100/batch)
        NS2->>FCM: sendNotification($token, $title, $body, $image, $customData)
        FCM->>OAUTH: getAccessToken($credentialsPath)
        OAUTH->>OAUTH: Cache::remember('fcm_access_token', 3500s)
        OAUTH-->>FCM: OAuth2 Bearer Token

        FCM->>GOOGLE: HTTP POST with FCM v1 JSON payload

        alt ✅ Success (HTTP 2xx)
            GOOGLE-->>FCM: {name: "projects/{id}/messages/{msg_id}"}
            FCM-->>NS2: ['success' => true, 'message_id' => ...]
            NS2->>DB: UPDATE recipient SET status='sent', sent_at=now()
            NS2->>NR: incrementCounter($id, 'success_count')
        else ❌ Failure
            GOOGLE-->>FCM: Error response
            FCM-->>NS2: ['success' => false, 'error' => ...]
            NS2->>DB: UPDATE recipient SET status='failed', error_message=...
            NS2->>NR: incrementCounter($id, 'failure_count')
            opt Token Invalid/Unregistered
                NS2->>DB: DELETE stale device_token via DeviceTokenRepository::deleteByToken()
            end
        end
    end

    NS2->>DB: UPDATE notifications SET status = 'completed'
    deactivate JOB

    GOOGLE-->>Reader: 📱 Push Notification Delivered via FCM
```

---

## 3. Detailed Sequence Diagram — Custom Admin Push

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin (Browser)
    participant NP as NotificationsPage.jsx<br/>(handleSendNotification)
    participant AX as axios.js<br/>(POST /api/notifications)
    participant NC as NotificationController.php<br/>(store)
    participant NS as NotificationService.php<br/>(createCustomNotification)
    participant NR as NotificationRepository.php<br/>(create)
    participant JOB as SendCustomNotificationJob.php<br/>(handle)
    participant SUB as SubscriptionRepository.php<br/>(getSubscriberIds)
    participant NS2 as NotificationService.php<br/>(sendNotificationToUsers)
    participant FCM as FcmService.php<br/>(sendNotification)
    participant GOOGLE as Google FCM v1 API

    Admin->>NP: Fill form (title, body, target, user_ids)
    NP->>AX: api.post('/notifications', payload)
    AX->>NC: POST /api/notifications
    NC->>NC: Validate request (title, body, target, user_ids)

    NC->>NS: createCustomNotification($sender, $data)
    NS->>NR: create() → Insert notification (status=pending)
    NS->>JOB: SendCustomNotificationJob::dispatch($notification, $target, $userIds)
    NC-->>Admin: HTTP 201 — Notification queued

    Note over JOB: ⏳ Runs asynchronously in Queue Worker
    activate JOB

    alt target === 'subscribers'
        JOB->>SUB: getSubscriberIds($senderId)
        SUB-->>JOB: Resolved subscriber IDs
    else target === 'specific_users'
        JOB->>JOB: Use provided $userIds directly
    else target === 'all'
        JOB->>JOB: $resolvedUserIds = null (all devices)
    end

    JOB->>NS2: sendNotificationToUsers($notification, $resolvedUserIds)
    Note over NS2: Same dispatch loop as Post flow:<br/>createRecipients → FCM loop → status update

    NS2->>FCM: sendNotification() per device token
    FCM->>GOOGLE: HTTP POST FCM v1

    deactivate JOB
```

---

## 4. Detailed Sequence Diagram — Subscription Push

```mermaid
sequenceDiagram
    autonumber
    actor Reader as Reader (Browser)
    participant SC as SubscriptionController.php<br/>(subscribe)
    participant SS as SubscriptionService.php<br/>(subscribe)
    participant SUBREPO as SubscriptionRepository.php<br/>(subscribe)
    participant JOB as SendSubscriptionNotificationJob.php<br/>(handle)
    participant DT as DeviceToken Model<br/>(query)
    participant FCM as FcmService.php<br/>(sendNotification)
    participant GOOGLE as Google FCM v1 API
    actor Author as Author (Devices)

    Reader->>SC: POST /api/subscriptions/subscribe {author_id}
    SC->>SS: subscribe($reader, $authorId)
    SS->>SUBREPO: subscribe($readerId, $authorId) → firstOrCreate
    SS->>JOB: SendSubscriptionNotificationJob::dispatch($author, $reader)
    SC-->>Reader: HTTP 200 — Subscribed

    Note over JOB: ⏳ Runs asynchronously in Queue Worker
    activate JOB
    JOB->>DT: DeviceToken::where('user_id', $author→id)→get()

    loop For each author device token
        JOB->>FCM: sendNotification($token, "New Subscriber!", body, null, $data)
        FCM->>GOOGLE: HTTP POST FCM v1
        GOOGLE-->>FCM: Response
        FCM-->>JOB: Result
    end
    deactivate JOB

    GOOGLE-->>Author: 📱 "New Subscriber!" push delivered
```

---

## 5. File & Method Reference Table

### Backend — `notification-api/`

| # | File Path | Method | Role |
|---|-----------|--------|------|
| 1 | `app/Http/Controllers/PostController.php` | `store()` | Validates input, calls `PostService::createPost()` |
| 2 | `app/Services/PostService.php` | `createPost()` | Saves post to DB, dispatches `SendPostNotificationJob` |
| 3 | `app/Jobs/SendPostNotificationJob.php` | `handle()` | Eager-loads author, calls `NotificationService::dispatchPostNotification()` |
| 4 | `app/Http/Controllers/NotificationController.php` | `store()` | Validates custom push form, calls `NotificationService::createCustomNotification()` |
| 5 | `app/Services/NotificationService.php` | `createCustomNotification()` | Creates notification record, dispatches `SendCustomNotificationJob` |
| 6 | `app/Jobs/SendCustomNotificationJob.php` | `handle()` | Resolves target users (all/subscribers/specific), calls `sendNotificationToUsers()` |
| 7 | `app/Http/Controllers/SubscriptionController.php` | `subscribe()` | Validates subscription, calls `SubscriptionService::subscribe()` |
| 8 | `app/Services/SubscriptionService.php` | `subscribe()` | Creates subscription record, dispatches `SendSubscriptionNotificationJob` |
| 9 | `app/Jobs/SendSubscriptionNotificationJob.php` | `handle()` | Fetches author device tokens, sends FCM push directly via `FcmService` |
| 10 | `app/Services/NotificationService.php` | `dispatchPostNotification()` | Creates notification + recipients, resolves subscribers, invokes `sendNotificationToUsers()` |
| 11 | `app/Services/NotificationService.php` | `sendNotificationToUsers()` | Chunks recipients, creates DB logs, iterates FCM sending, tracks success/failure |
| 12 | `app/Services/FcmService.php` | `sendNotification()` | Builds FCM v1 JSON payload, handles HTTP POST to Google API |
| 13 | `app/Services/FcmService.php` | `getAccessToken()` | Fetches & caches Google OAuth2 token (3500s TTL) |
| 14 | `app/Services/FcmService.php` | `sendMockNotification()` | Simulates push delivery in dev/test mode |
| 15 | `app/Repositories/NotificationRepository.php` | `create()` | Inserts `notifications` table record |
| 16 | `app/Repositories/NotificationRepository.php` | `createRecipients()` | Bulk-inserts `notification_recipients` rows |
| 17 | `app/Repositories/NotificationRepository.php` | `incrementCounter()` | Atomically increments `success_count` or `failure_count` |
| 18 | `app/Repositories/SubscriptionRepository.php` | `getSubscriberIds()` | Plucks `reader_id` from `subscriptions` for an author |
| 19 | `app/Repositories/DeviceTokenRepository.php` | `deleteByToken()` | Removes stale/invalid FCM device tokens |

### Frontend — `notification-admin/src/`

| # | File Path | Method / Handler | Role |
|---|-----------|------------------|------|
| 1 | `firebase.js` | `getMessaging()` | Initializes Firebase Cloud Messaging instance |
| 2 | `hooks/usePushNotifications.jsx` | `onMessage()` listener | Receives foreground FCM push, builds `newRecord` object |
| 3 | `hooks/usePushNotifications.jsx` | `requestAndRegister()` | Requests browser permission, fetches FCM token, saves to backend |
| 4 | `hooks/usePushNotifications.jsx` | `unregister()` | Deletes FCM token from backend & localStorage |
| 5 | `hooks/usePushNotifications.jsx` | `toast.custom()` | Renders glassmorphic clickable toast notification |
| 6 | `pages/NotificationsPage.jsx` | `handleSendNotification()` | Author/Admin form: POSTs custom push to `/api/notifications` |
| 7 | `components/Layout.jsx` | `usePushNotifications()` init | Auto-prompts permission on login if status is `default` |

### API Routes — `routes/api.php`

| Route | Method | Controller → Action |
|-------|--------|---------------------|
| `POST /api/posts` | POST | `PostController@store` |
| `POST /api/notifications` | POST | `NotificationController@store` |
| `POST /api/subscriptions/subscribe` | POST | `SubscriptionController@subscribe` |
| `POST /api/device-tokens` | POST | `DeviceTokenController@store` |
| `DELETE /api/device-tokens` | DELETE | `DeviceTokenController@destroy` |

---

## 6. FCM v1 Payload Structure

```json
{
  "message": {
    "token": "<device_fcm_token>",
    "notification": {
      "title": "New Post Published!",
      "body": "AuthorName has published: \"Post Title\""
    },
    "data": {
      "recipient_id": "42",
      "sender_name": "AuthorName",
      "post_id": "7"
    },
    "android": {
      "notification": { "image": "<image_url>" }
    },
    "apns": {
      "payload": { "aps": { "mutable-content": 1 } },
      "fcm_options": { "image": "<image_url>" }
    },
    "webpush": {
      "notification": { "image": "<image_url>" }
    }
  }
}
```

---

## 7. Database Tables Involved

```mermaid
erDiagram
    users ||--o{ posts : "author_id"
    users ||--o{ device_tokens : "user_id"
    users ||--o{ subscriptions : "reader_id / author_id"
    users ||--o{ notifications : "sender_id"
    posts ||--o{ notifications : "post_id"
    notifications ||--o{ notification_recipients : "notification_id"
    notification_recipients }o--|| device_tokens : "device_token_id"
    notification_recipients }o--|| users : "user_id"

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
    }

    device_tokens {
        int id PK
        int user_id FK
        string token
        string platform
        string device_name
        timestamp last_used_at
    }
```
