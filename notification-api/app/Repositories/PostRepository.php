<?php

namespace App\Repositories;

use App\Models\Post;
use App\Repositories\Contracts\PostRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PostRepository implements PostRepositoryInterface
{
    public function create(array $data): Post
    {
        return Post::create($data);
    }

    public function findById(int $id): ?Post
    {
        return Post::with('author')->find($id);
    }

    public function update(int $postId, array $data): Post
    {
        $post = Post::findOrFail($postId);
        $post->update($data);

        return $post->fresh('author');
    }

    public function delete(int $postId): bool
    {
        return (bool) Post::destroy($postId);
    }

    public function paginateByAuthor(int $authorId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Post::with('author')
                     ->where('author_id', $authorId)
                     ->latest();

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where('title', 'like', $search);
        }

        return $query->paginate($perPage);
    }

    public function paginateAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Post::with('author')->latest();

        if (!empty($filters['author_id'])) {
            $query->where('author_id', $filters['author_id']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where('title', 'like', $search);
        }

        return $query->paginate($perPage);
    }
}
