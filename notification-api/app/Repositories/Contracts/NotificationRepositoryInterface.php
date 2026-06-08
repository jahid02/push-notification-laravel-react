<?php

namespace App\Repositories\Contracts;

use App\Models\Notification;
use App\Models\NotificationRecipient;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface
{
    /**
     * Create a new notification record.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Notification;

    /**
     * Find a notification by its ID (with recipients and sender).
     */
    public function findById(int $id): ?Notification;

    /**
     * Update a notification record.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(int $notificationId, array $data): Notification;

    /**
     * Return paginated notifications for a specific sender (author view).
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginateBySender(int $senderId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Return all paginated notifications (admin view).
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Bulk-insert recipient records for a notification.
     * Each item: ['notification_id', 'user_id', 'device_token_id', 'status']
     *
     * @param  array<int, array<string, mixed>>  $recipients
     */
    public function createRecipients(array $recipients): void;

    /**
     * Update a single recipient delivery record.
     *
     * @param  array<string, mixed>  $data  e.g. ['status', 'fcm_message_id', 'sent_at']
     */
    public function updateRecipient(int $recipientId, array $data): NotificationRecipient;

    /**
     * Increment the success or failure counter on a notification atomically.
     */
    public function incrementCounter(int $notificationId, string $counter): void;
}
