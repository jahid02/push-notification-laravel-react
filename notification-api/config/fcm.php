<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Firebase Project ID
    |--------------------------------------------------------------------------
    | Your Firebase project ID from the Firebase Console.
    | Found at: Project Settings → General → Project ID
    */
    'project_id' => env('FCM_PROJECT_ID'),

    /*
    |--------------------------------------------------------------------------
    | Service Account Credentials Path
    |--------------------------------------------------------------------------
    | Absolute or relative path to the Firebase service account JSON file.
    | Download from: Firebase Console → Project Settings → Service Accounts
    | Place the file at: storage/app/firebase/service-account.json
    */
    'credentials_path' => env('FCM_CREDENTIALS_PATH', storage_path('app/firebase/service-account.json')),

    /*
    |--------------------------------------------------------------------------
    | VAPID Key (Web Push)
    |--------------------------------------------------------------------------
    | Used by the browser service worker to subscribe to web push notifications.
    | Found at: Firebase Console → Project Settings → Cloud Messaging → Web Push Certificates
    */
    'vapid_key' => env('FIREBASE_VAPID_KEY'),

    /*
    |--------------------------------------------------------------------------
    | FCM API Endpoint
    |--------------------------------------------------------------------------
    | Firebase Cloud Messaging v1 HTTP API endpoint.
    */
    'endpoint' => 'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send',

    /*
    |--------------------------------------------------------------------------
    | OAuth2 Scope
    |--------------------------------------------------------------------------
    | Required scope for authenticating with the FCM v1 API.
    */
    'scope' => 'https://www.googleapis.com/auth/firebase.messaging',

];
