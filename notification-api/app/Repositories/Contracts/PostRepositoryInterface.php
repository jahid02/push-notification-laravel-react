<?php

namespace App\Repositories\Contracts;

use App\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PostRepositoryInterface
{
    /**
     * Create a new post.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Post;

    /**
     * Find a post by its ID.
     */
    public function findById(int $id): ?Post;

    /**
     * Update a post by its ID.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(int $postId, array $data): Post;

    /**
     * Delete a post by its ID.
     */
    public function delete(int $postId): bool;

    /**
     * Return paginated posts for a specific author.
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginateByAuthor(int $authorId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Return all paginated posts (admin view).
     *
     * @param  array<string, mixed>  $filters
     */
    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator;
}
