<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Display a listing of the notifications.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['status']);
        $perPage = (int) $request->get('per_page', 15);

        $notifications = $this->notificationService->listNotifications($request->user(), $filters, $perPage);

        return response()->json([
            'success' => true,
            'data'    => $notifications,
        ]);
    }

    /**
     * Display the specified notification details.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $notification = $this->notificationService->getNotificationDetails($id, $request->user());

        return response()->json([
            'success' => true,
            'data'    => [
                'notification' => $notification,
            ],
        ]);
    }

    /**
     * Create and dispatch a custom push notification.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'     => 'required|string|max:255',
            'body'      => 'required|string',
            'image_url' => 'nullable|url|max:255',
            'target'    => 'required|string|in:all,subscribers,specific_users',
            'user_ids'  => 'required_if:target,specific_users|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        try {
            $notification = $this->notificationService->createCustomNotification($request->user(), $data);

            return response()->json([
                'success' => true,
                'message' => 'Custom notification created and queue processing dispatched.',
                'data'    => [
                    'notification' => $notification,
                ],
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    /**
     * Display a listing of notifications received by the authenticated user.
     */
    public function inbox(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 15);
        $user = $request->user();

        $inbox = \App\Models\NotificationRecipient::with(['notification.sender', 'notification.post'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $inbox,
        ]);
    }

    /**
     * Get the count of unread notifications for the authenticated user.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = \App\Models\NotificationRecipient::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'unread_count' => $count,
            ],
        ]);
    }

    /**
     * Mark a specific notification recipient record as read.
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $recipient = \App\Models\NotificationRecipient::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $recipient->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }
}
