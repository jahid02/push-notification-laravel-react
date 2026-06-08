<?php

namespace App\Repositories\Contracts;

use App\Models\Subscription;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface SubscriptionRepositoryInterface
{
    /**
     * Subscribe a reader to an author.
     * Returns the existing subscription if one already exists.
     */
    public function subscribe(int $readerId, int $authorId): Subscription;

    /**
     * Unsubscribe a reader from an author.
     * Returns true if deleted, false if subscription did not exist.
     */
    public function unsubscribe(int $readerId, int $authorId): bool;

    /**
     * Check whether a reader is currently subscribed to an author.
     */
    public function isSubscribed(int $readerId, int $authorId): bool;

    /**
     * Get all subscribers (reader users) of a given author.
     * Returns user IDs along with their subscriptions.
     */
    public function getSubscribers(int $authorId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get all authors a given reader is subscribed to.
     */
    public function getSubscribedAuthors(int $readerId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Get the IDs of all readers subscribed to a given author.
     *
     * @return Collection<int, int>
     */
    public function getSubscriberIds(int $authorId): Collection;
}
