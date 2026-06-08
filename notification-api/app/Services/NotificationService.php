<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Repositories\Contracts\DeviceTokenRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class NotificationService
{
    public function __construct(
        private readonly NotificationRepositoryInterface $notificationRepository,
        private readonly SubscriptionRepositoryInterface $subscriptionRepository,
        private readonly DeviceTokenRepositoryInterface $deviceTokenRepository,
        private readonly FcmService $fcmService,
    ) {}

    /**
     * List paginated notifications. Admins see all, authors see their sent notifications.
     */
    public function listNotifications(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        if ($actor->isAdmin()) {
            return $this->notificationRepository->paginateAll($filters, $perPage);
        }

        return $this->notificationRepository->paginateBySender($actor->id, $filters, $perPage);
    }

    /**
     * Get details of a single notification with recipient details.
     */
    public function getNotificationDetails(int $id, User $actor): Notification
    {
        $notification = $this->notificationRepository->findById($id);

        if (!$notification) {
            abort(404, 'Notification not found.');
        }

        if (!$actor->isAdmin() && $notification->sender_id !== $actor->id) {
            abort(403, 'You do not have permission to view this notification.');
        }

        return $notification;
    }

    /**
     * Create a custom notification record and dispatch the job.
     *
     * @param  User  $sender
     * @param  array<string, mixed>  $data
     * @return Notification
     * @throws ValidationException
     */
    public function createCustomNotification(User $sender, array $data): Notification
    {
        $target = $data['target'] ?? 'all';
        $userIds = $data['user_ids'] ?? [];

        if (!in_array($target, ['all', 'subscribers', 'specific_users'], true)) {
            throw ValidationException::withMessages([
                'target' => ['Invalid dispatch target.'],
            ]);
        }

        if ($target === 'specific_users' && empty($userIds)) {
            throw ValidationException::withMessages([
                'user_ids' => ['Specific users must contain at least one user ID.'],
            ]);
        }

        $notification = $this->notificationRepository->create([
            'sender_id' => $sender->id,
            'title'     => $data['title'],
            'body'      => $data['body'],
            'image_url' => $data['image_url'] ?? null,
            'target'    => $target,
            'status'    => 'pending',
        ]);

        // Dispatch the asynchronous background sending process
        \App\Jobs\SendCustomNotificationJob::dispatch($notification, $target, $userIds);

        return $notification;
    }

    /**
     * Internal method called by jobs to send the notifications to users.
     * Chunk-safe, transactional-safe, and clears stale device tokens automatically.
     */
    public function sendNotificationToUsers(Notification $notification, ?array $userIds = null): void
    {
        if ($userIds !== null && empty($userIds)) {
            $notification->update(['status' => 'completed']);
            return;
        }

        $notification->update(['status' => 'processing']);

        $query = \App\Models\DeviceToken::query();
        if ($userIds !== null) {
            $query->whereIn('user_id', $userIds);
        }

        $totalRecipients = 0;

        // Chunking prevents memory overflow when notifying large groups
        $query->chunk(200, function ($deviceTokens) use ($notification, &$totalRecipients) {
            $recipientsData = [];
            foreach ($deviceTokens as $token) {
                $recipientsData[] = [
                    'notification_id' => $notification->id,
                    'user_id'         => $token->user_id,
                    'device_token_id' => $token->id,
                    'status'          => 'pending',
                ];
            }

            if (!empty($recipientsData)) {
                $this->notificationRepository->createRecipients($recipientsData);
                $totalRecipients += count($recipientsData);
            }
        });

        if ($totalRecipients === 0) {
            $notification->update(['status' => 'completed']);
            return;
        }

        // Process dispatch chunk-by-chunk using chunkById to safely modify records during loop
        \App\Models\NotificationRecipient::where('notification_id', $notification->id)
            ->where('status', 'pending')
            ->with('deviceToken')
            ->chunkById(100, function ($recipients) use ($notification) {
                foreach ($recipients as $recipient) {
                    if (!$recipient->deviceToken) {
                        $recipient->update([
                            'status'        => 'failed',
                            'error_message' => 'FCM Device token record not found.',
                        ]);
                        $this->notificationRepository->incrementCounter($notification->id, 'failure_count');
                        continue;
                    }

                    $customData = [];
                    if ($notification->post_id) {
                        $customData['post_id'] = (string) $notification->post_id;
                    }

                    $res = $this->fcmService->sendNotification(
                        $recipient->deviceToken->token,
                        $notification->title,
                        $notification->body,
                        $notification->image_url,
                        $customData
                    );

                    if ($res['success']) {
                        $recipient->update([
                            'status'         => 'sent',
                            'fcm_message_id' => $res['message_id'],
                            'sent_at'        => now(),
                        ]);
                        $this->notificationRepository->incrementCounter($notification->id, 'success_count');
                    } else {
                        $recipient->update([
                            'status'        => 'failed',
                            'error_message' => $res['error'] ?? 'Unknown delivery failure.',
                        ]);
                        $this->notificationRepository->incrementCounter($notification->id, 'failure_count');

                        // Clean up stale token if FCM notifies that token is invalid or unregistered
                        $error = strtolower($res['error'] ?? '');
                        if (str_contains($error, 'invalid') || str_contains($error, 'unregistered')) {
                            Log::info("Deleting stale device token: {$recipient->deviceToken->token}");
                            $this->deviceTokenRepository->deleteByToken($recipient->deviceToken->token);
                        }
                    }
                }
            });

        $notification->update(['status' => 'completed']);
    }

    /**
     * Dispatch notification to subscribers when a post is created.
     * Invoked asynchronously by SendPostNotificationJob.
     */
    public function dispatchPostNotification(\App\Models\Post $post): void
    {
        $notification = $this->notificationRepository->create([
            'sender_id' => $post->author_id,
            'post_id'   => $post->id,
            'title'     => 'New Post Published!',
            'body'      => "{$post->author->name} has published: \"{$post->title}\"",
            'image_url' => $post->image_url,
            'target'    => 'subscribers',
            'status'    => 'pending',
        ]);

        $subscriberIds = $this->subscriptionRepository->getSubscriberIds($post->author_id);

        $this->sendNotificationToUsers($notification, $subscriberIds->toArray());
    }
}
