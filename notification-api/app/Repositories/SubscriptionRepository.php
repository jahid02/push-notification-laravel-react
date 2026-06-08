<?php

namespace App\Repositories;

use App\Models\Subscription;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class SubscriptionRepository implements SubscriptionRepositoryInterface
{
    public function subscribe(int $readerId, int $authorId): Subscription
    {
        return Subscription::firstOrCreate([
            'reader_id' => $readerId,
            'author_id' => $authorId,
        ]);
    }

    public function unsubscribe(int $readerId, int $authorId): bool
    {
        return (bool) Subscription::where('reader_id', $readerId)
                                   ->where('author_id', $authorId)
                                   ->delete();
    }

    public function isSubscribed(int $readerId, int $authorId): bool
    {
        return Subscription::where('reader_id', $readerId)
                           ->where('author_id', $authorId)
                           ->exists();
    }

    public function getSubscribers(int $authorId, int $perPage = 15): LengthAwarePaginator
    {
        return Subscription::with('reader')
                           ->where('author_id', $authorId)
                           ->latest()
                           ->paginate($perPage);
    }

    public function getSubscribedAuthors(int $readerId, int $perPage = 15): LengthAwarePaginator
    {
        return Subscription::with('author')
                           ->where('reader_id', $readerId)
                           ->latest()
                           ->paginate($perPage);
    }

    public function getSubscriberIds(int $authorId): Collection
    {
        return Subscription::where('author_id', $authorId)
                           ->pluck('reader_id');
    }
}
