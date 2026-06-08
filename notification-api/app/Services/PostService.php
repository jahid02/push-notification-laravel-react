<?php

namespace App\Services;

use App\Jobs\SendPostNotificationJob;
use App\Models\Post;
use App\Models\User;
use App\Repositories\Contracts\PostRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PostService
{
    public function __construct(
        private readonly PostRepositoryInterface $postRepository,
    ) {}

    /**
     * List posts. Admins see all, authors see only their own.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listPosts(User $actor, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        if ($actor->isAdmin()) {
            return $this->postRepository->paginateAll($filters, $perPage);
        }

        return $this->postRepository->paginateByAuthor($actor->id, $filters, $perPage);
    }

    /**
     * Get a single post by ID.
     */
    public function getPost(int $postId): Post
    {
        $post = $this->postRepository->findById($postId);

        if (!$post) {
            abort(404, 'Post not found.');
        }

        return $post;
    }

    /**
     * Create a new post and dispatch the FCM notification job.
     *
     * @param  array<string, mixed>  $data
     */
    public function createPost(User $author, array $data): Post
    {
        $post = $this->postRepository->create([
            'author_id'    => $author->id,
            'title'        => $data['title'],
            'body'         => $data['body'],
            'image_url'    => $data['image_url'] ?? null,
            'published_at' => now(),
        ]);

        // Dispatch the queued job to send FCM notifications to all subscribers
        SendPostNotificationJob::dispatch($post);

        return $post;
    }

    /**
     * Update a post. Only the author or admin may update.
     *
     * @param  array<string, mixed>  $data
     */
    public function updatePost(int $postId, User $actor, array $data): Post
    {
        $post = $this->getPost($postId);

        $this->authorizePostAction($post, $actor);

        return $this->postRepository->update($postId, array_filter([
            'title'     => $data['title']     ?? null,
            'body'      => $data['body']      ?? null,
            'image_url' => $data['image_url'] ?? null,
        ], fn($v) => $v !== null));
    }

    /**
     * Delete a post. Only the author or admin may delete.
     */
    public function deletePost(int $postId, User $actor): bool
    {
        $post = $this->getPost($postId);

        $this->authorizePostAction($post, $actor);

        return $this->postRepository->delete($postId);
    }

    /**
     * Ensure the actor is the post's author or an admin.
     */
    private function authorizePostAction(Post $post, User $actor): void
    {
        if (!$actor->isAdmin() && $post->author_id !== $actor->id) {
            abort(403, 'You do not have permission to modify this post.');
        }
    }
}
