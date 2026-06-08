<?php

namespace App\Jobs;

use App\Models\Notification;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use App\Services\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendCustomNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var int
     */
    public $backoff = 30;

    /**
     * Create a new job instance.
     *
     * @param  Notification  $notification
     * @param  string  $target  'all' | 'subscribers' | 'specific_users'
     * @param  array<int>  $userIds
     */
    public function __construct(
        public readonly Notification $notification,
        public readonly string $target = 'all',
        public readonly array $userIds = []
    ) {}

    /**
     * Execute the job.
     */
    public function handle(
        NotificationService $notificationService,
        SubscriptionRepositoryInterface $subscriptionRepository
    ): void {
        $resolvedUserIds = null;

        if ($this->target === 'subscribers') {
            // Asynchronously resolve target subscribers on the queue worker thread
            $subscriberIds = $subscriptionRepository->getSubscriberIds($this->notification->sender_id);
            $resolvedUserIds = $subscriberIds->toArray();
        } elseif ($this->target === 'specific_users') {
            $resolvedUserIds = $this->userIds;
        }

        // Delegate FCM processing to NotificationService
        $notificationService->sendNotificationToUsers($this->notification, $resolvedUserIds);
    }
}
