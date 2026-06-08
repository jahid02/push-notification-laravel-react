<?php

namespace App\Repositories;

use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function create(array $data): Notification
    {
        return Notification::create($data);
    }

    public function findById(int $id): ?Notification
    {
        return Notification::with(['post', 'sender', 'recipients.user', 'recipients.deviceToken'])
                           ->find($id);
    }

    public function update(int $notificationId, array $data): Notification
    {
        $notification = Notification::findOrFail($notificationId);
        $notification->update($data);

        return $notification->fresh();
    }

    public function paginateBySender(int $senderId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Notification::with(['post', 'sender'])
                             ->where('sender_id', $senderId)
                             ->latest();

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate($perPage);
    }

    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Notification::with(['post', 'sender'])->latest();

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['sender_id'])) {
            $query->where('sender_id', $filters['sender_id']);
        }

        return $query->paginate($perPage);
    }

    public function createRecipients(array $recipients): void
    {
        // Bulk-insert with timestamps for efficiency
        $now = now();
        $rows = array_map(function ($row) use ($now) {
            return array_merge($row, [
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }, $recipients);

        NotificationRecipient::insert($rows);
    }

    public function updateRecipient(int $recipientId, array $data): NotificationRecipient
    {
        $recipient = NotificationRecipient::findOrFail($recipientId);
        $recipient->update($data);

        return $recipient->fresh();
    }

    public function incrementCounter(int $notificationId, string $counter): void
    {
        // Atomic increment — safe under concurrent queue workers
        Notification::where('id', $notificationId)->increment($counter);
    }
}
