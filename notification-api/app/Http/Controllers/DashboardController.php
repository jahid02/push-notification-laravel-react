<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use App\Models\Notification;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Retrieve dashboard stats tailored to the user's role.
     */
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();

        if ($actor->isAdmin()) {
            return $this->getAdminStats();
        }

        if ($actor->isAuthor()) {
            return $this->getAuthorStats($actor->id);
        }

        // Reader stats (minimal)
        return response()->json([
            'success' => true,
            'data'    => [
                'role'               => 'reader',
                'subscribed_authors' => Subscription::where('reader_id', $actor->id)->count(),
                'registered_devices' => DeviceToken::where('user_id', $actor->id)->count(),
            ],
        ]);
    }

    /**
     * Compile global administrative metrics.
     */
    private function getAdminStats(): JsonResponse
    {
        $usersCount   = User::count();
        $authorsCount = User::where('role', 'author')->count();
        $readersCount = User::where('role', 'reader')->count();
        $postsCount   = Post::count();
        $subscriptionsCount = Subscription::count();
        
        // Count device tokens by platform
        $devicesByPlatform = DeviceToken::selectRaw('platform, count(*) as count')
            ->groupBy('platform')
            ->pluck('count', 'platform')
            ->toArray();

        // Ensure default platforms are populated
        $platforms = ['web' => 0, 'android' => 0, 'ios' => 0];
        $devicesByPlatform = array_merge($platforms, $devicesByPlatform);
        $totalDevices = array_sum($devicesByPlatform);

        // Compute notification delivery metrics
        $notificationsCount = Notification::count();
        $sentCount = (int) Notification::sum('success_count');
        $failedCount = (int) Notification::sum('failure_count');
        $totalDeliveryAttempts = $sentCount + $failedCount;

        $successRate = $totalDeliveryAttempts > 0 
            ? round(($sentCount / $totalDeliveryAttempts) * 100, 2) 
            : 100.00;

        // Count failed jobs in database
        $failedJobsCount = DB::table('failed_jobs')->count();

        // Fetch recent notification logs
        $recentNotifications = Notification::with('sender:id,name')
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'role' => 'admin',
                'stats' => [
                    'total_users'         => $usersCount,
                    'total_authors'       => $authorsCount,
                    'total_readers'       => $readersCount,
                    'total_posts'         => $postsCount,
                    'total_subscriptions' => $subscriptionsCount,
                    'total_devices'       => $totalDevices,
                    'devices_by_platform' => $devicesByPlatform,
                    'total_notifications' => $notificationsCount,
                    'delivery' => [
                        'sent'         => $sentCount,
                        'failed'       => $failedCount,
                        'success_rate' => $successRate,
                    ],
                    'queue_failed_jobs'   => $failedJobsCount,
                ],
                'recent_notifications' => $recentNotifications,
            ],
        ]);
    }

    /**
     * Compile metrics scoped to a specific author.
     */
    private function getAuthorStats(int $authorId): JsonResponse
    {
        $postsCount = Post::where('author_id', $authorId)->count();
        $subscribersCount = Subscription::where('author_id', $authorId)->count();

        // Compute notification stats for notifications sent by this author
        $notificationsCount = Notification::where('sender_id', $authorId)->count();
        $sentCount = (int) Notification::where('sender_id', $authorId)->sum('success_count');
        $failedCount = (int) Notification::where('sender_id', $authorId)->sum('failure_count');
        $totalDeliveryAttempts = $sentCount + $failedCount;

        $successRate = $totalDeliveryAttempts > 0 
            ? round(($sentCount / $totalDeliveryAttempts) * 100, 2) 
            : 100.00;

        // Fetch recent notifications sent by this author
        $recentNotifications = Notification::where('sender_id', $authorId)
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'role' => 'author',
                'stats' => [
                    'total_posts'         => $postsCount,
                    'total_subscribers'   => $subscribersCount,
                    'total_notifications' => $notificationsCount,
                    'delivery' => [
                        'sent'         => $sentCount,
                        'failed'       => $failedCount,
                        'success_rate' => $successRate,
                    ],
                ],
                'recent_notifications' => $recentNotifications,
            ],
        ]);
    }
}
