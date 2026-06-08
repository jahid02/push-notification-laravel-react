<?php

namespace App\Http\Controllers;

use App\Services\SubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SubscriptionController extends Controller
{
    public function __construct(
        private readonly SubscriptionService $subscriptionService
    ) {}

    /**
     * Subscribe the authenticated reader to an author.
     */
    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'author_id' => 'required|integer|exists:users,id',
        ]);

        try {
            $subscription = $this->subscriptionService->subscribe(
                $request->user(),
                (int) $request->input('author_id')
            );

            return response()->json([
                'success' => true,
                'message' => 'Subscribed successfully.',
                'data'    => [
                    'subscription' => $subscription,
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
     * Unsubscribe the authenticated reader from an author.
     */
    public function unsubscribe(Request $request): JsonResponse
    {
        $request->validate([
            'author_id' => 'required|integer|exists:users,id',
        ]);

        $deleted = $this->subscriptionService->unsubscribe(
            $request->user(),
            (int) $request->input('author_id')
        );

        return response()->json([
            'success' => true,
            'message' => $deleted ? 'Unsubscribed successfully.' : 'Subscription not found.',
        ]);
    }

    /**
     * Display a listing of authors the authenticated reader is subscribed to.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 15);
        $authors = $this->subscriptionService->getSubscribedAuthors($request->user(), $perPage);

        return response()->json([
            'success' => true,
            'data'    => $authors,
        ]);
    }

    /**
     * Display a listing of readers who are subscribed to a specific author.
     */
    public function subscribers(Request $request, int $authorId): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 15);
        
        // Ensure the actor has access (Admin or the author itself)
        $actor = $request->user();
        if (!$actor->isAdmin() && $actor->id !== $authorId) {
            abort(403, 'You do not have permission to view this author\'s subscribers.');
        }

        $subscribers = $this->subscriptionService->getSubscribers($authorId, $perPage);

        return response()->json([
            'success' => true,
            'data'    => $subscribers,
        ]);
    }

    /**
     * Check subscription status between the authenticated reader and an author.
     */
    public function status(Request $request, int $authorId): JsonResponse
    {
        $isSubscribed = $this->subscriptionService->isSubscribed($request->user()->id, $authorId);

        return response()->json([
            'success'      => true,
            'is_subscribed' => $isSubscribed,
        ]);
    }
}
