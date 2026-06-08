<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceTokenController;
use App\Http\Controllers\FailedJobController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ─── Guest/Auth Public Endpoints ──────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('refresh', [AuthController::class, 'refresh']);
});

// ─── Authenticated Endpoints (Required JWT Access Token) ──────────────────
Route::middleware('jwt.auth')->group(function () {
    
    // Auth Profile
    Route::get('auth/me', [AuthController::class, 'me']);
    
    // Device Tokens (FCM Registration)
    Route::post('device-tokens', [DeviceTokenController::class, 'store']);
    Route::delete('device-tokens', [DeviceTokenController::class, 'destroy']);

    // Universal Dashboard
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Authors Directory (accessible by anyone authenticated, including readers)
    Route::get('authors', [UserController::class, 'index']);

    // Post Feed and Viewer (accessible by anyone authenticated, including readers)
    Route::get('feed', [PostController::class, 'feed']);
    Route::get('posts/{id}', [PostController::class, 'show']);

    // Received Notification Inbox (accessible by anyone authenticated, including readers)
    Route::get('notifications/inbox', [NotificationController::class, 'inbox']);

    // ─── Reader-specific Actions (Role: reader) ──────────────────────────
    Route::middleware('role:reader')->group(function () {
        Route::post('subscriptions/subscribe', [SubscriptionController::class, 'subscribe']);
        Route::post('subscriptions/unsubscribe', [SubscriptionController::class, 'unsubscribe']);
        Route::get('subscriptions', [SubscriptionController::class, 'index']);
        Route::get('subscriptions/status/{authorId}', [SubscriptionController::class, 'status']);
    });

    // ─── Content and Dispatch (Role: author, admin) ─────────────────────────
    Route::middleware('role:author,admin')->group(function () {
        // Posts management
        Route::apiResource('posts', PostController::class);
        
        // Notifications & FCM logs (read-only for authors)
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/{id}', [NotificationController::class, 'show']);

        // Subscribers list lookup for authors
        Route::get('users/{authorId}/subscribers', [SubscriptionController::class, 'subscribers']);

        // User Directory (Search & Select)
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{id}', [UserController::class, 'show']);
    });

    // ─── System Administration & Queue Control (Role: admin) ─────────────────
    Route::middleware('role:admin')->group(function () {
        // Custom push dispatch — admin only
        Route::post('notifications', [NotificationController::class, 'store']);

        // Post restriction management — admin only
        Route::post('posts/{id}/restrict', [PostController::class, 'restrict']);

        // User promotion/demotion/deletion
        Route::put('users/{id}/role', [UserController::class, 'updateRole']);
        Route::delete('users/{id}', [UserController::class, 'destroy']);

        // Queue & failed jobs control
        Route::post('failed-jobs/retry-all', [FailedJobController::class, 'retryAll']);
        Route::delete('failed-jobs/flush', [FailedJobController::class, 'destroyAll']);
        Route::apiResource('failed-jobs', FailedJobController::class)->only(['index', 'show', 'destroy']);
        Route::post('failed-jobs/{id}/retry', [FailedJobController::class, 'retry']);
    });
});

