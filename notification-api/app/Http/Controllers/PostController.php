<?php

namespace App\Http\Controllers;

use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(
        private readonly PostService $postService
    ) {}

    /**
     * Display a listing of the posts.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'author_id']);
        $perPage = (int) $request->get('per_page', 15);

        $posts = $this->postService->listPosts($request->user(), $filters, $perPage);

        return response()->json([
            'success' => true,
            'data'    => $posts,
        ]);
    }

    /**
     * Display the specified post details.
     */
    public function show(int $id): JsonResponse
    {
        $post = $this->postService->getPost($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'post' => $post,
            ],
        ]);
    }

    /**
     * Create a new post and dispatch the subscribers notification job.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'     => 'required|string|max:255',
            'body'      => 'required|string',
            'image_url' => 'nullable|url|max:255',
        ]);

        $post = $this->postService->createPost($request->user(), $data);

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully and notification dispatch queued.',
            'data'    => [
                'post' => $post,
            ],
        ], 201);
    }

    /**
     * Update the specified post.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'title'     => 'nullable|string|max:255',
            'body'      => 'nullable|string',
            'image_url' => 'nullable|url|max:255',
        ]);

        $post = $this->postService->updatePost($id, $request->user(), $data);

        return response()->json([
            'success' => true,
            'message' => 'Post updated successfully.',
            'data'    => [
                'post' => $post,
                ],
        ]);
    }

    /**
     * Delete the specified post.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->postService->deletePost($id, $request->user());

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully.',
        ]);
    }

    /**
     * Display a feed of posts for the authenticated reader.
     */
    public function feed(Request $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->only(['search']);
        $perPage = (int) $request->get('per_page', 12);
        $onlySubscribed = $request->boolean('subscribed', false);

        if ($onlySubscribed) {
            $subscribedAuthorIds = $user->subscribedAuthors()->pluck('users.id')->toArray();
            
            if (empty($subscribedAuthorIds)) {
                $posts = new \Illuminate\Pagination\LengthAwarePaginator([], 0, $perPage);
            } else {
                $query = \App\Models\Post::with('author')
                             ->whereIn('author_id', $subscribedAuthorIds)
                             ->latest();

                if (!empty($filters['search'])) {
                    $search = '%' . $filters['search'] . '%';
                    $query->where(function($q) use ($search) {
                        $q->where('title', 'like', $search)
                          ->orWhere('body', 'like', $search);
                    });
                }
                $posts = $query->paginate($perPage);
            }
        } else {
            $query = \App\Models\Post::with('author')->latest();

            if (!empty($filters['search'])) {
                $search = '%' . $filters['search'] . '%';
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', $search)
                      ->orWhere('body', 'like', $search);
                });
            }
            $posts = $query->paginate($perPage);
        }

        return response()->json([
            'success' => true,
            'data'    => $posts,
        ]);
    }

    /**
     * Admin: Restrict or unrestrict a post with a reason.
     */
    public function restrict(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status'             => 'required|in:active,restricted',
            'restriction_reason' => 'nullable|string|max:1000',
        ]);

        $post = $this->postService->getPost($id);

        $post->update([
            'status'             => $data['status'],
            'restriction_reason' => $data['status'] === 'restricted' ? ($data['restriction_reason'] ?? null) : null,
        ]);

        $message = $data['status'] === 'restricted'
            ? 'Post has been restricted successfully.'
            : 'Post restriction has been lifted.';

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => ['post' => $post->fresh()],
        ]);
    }
}

