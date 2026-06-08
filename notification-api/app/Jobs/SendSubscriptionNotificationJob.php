<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\DeviceToken;
use App\Services\FcmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendSubscriptionNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public readonly User $author,
        public readonly User $reader,
    ) {}

    /**
     * Execute the job — send FCM push to all of the author's devices.
     */
    public function handle(FcmService $fcmService): void
    {
        $deviceTokens = DeviceToken::where('user_id', $this->author->id)->get();

        if ($deviceTokens->isEmpty()) {
            Log::info("SendSubscriptionNotificationJob: Author #{$this->author->id} has no registered devices.");
            return;
        }

        $title = 'New Subscriber!';
        $body  = "{$this->reader->name} just subscribed to your channel.";
        $data  = [
            'type'      => 'new_subscriber',
            'reader_id' => (string) $this->reader->id,
            'redirect'  => 'subscribers',
        ];

        foreach ($deviceTokens as $token) {
            $result = $fcmService->sendNotification(
                $token->token,
                $title,
                $body,
                null,
                $data
            );

            if (!$result['success']) {
                Log::warning("SendSubscriptionNotificationJob: FCM failed for token {$token->token}: " . ($result['error'] ?? 'unknown'));
            }
        }
    }
}
