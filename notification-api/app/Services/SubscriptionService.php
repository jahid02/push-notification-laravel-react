<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\User;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class SubscriptionService
{
    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptionRepository,
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * Subscribe a reader to an author.
     *
     * @throws ValidationException
     */
    public function subscribe(User $reader, int $authorId): Subscription
    {
        if ($reader->id === $authorId) {
            throw ValidationException::withMessages([
                'author_id' => ['You cannot subscribe to yourself.'],
            ]);
        }

        $author = $this->userRepository->findById($authorId);

        if (!$author) {
            abort(404, 'Author not found.');
        }

        if (!$author->hasRole('author', 'admin')) {
            throw ValidationException::withMessages([
                'author_id' => ['You can only subscribe to authors or administrators.'],
            ]);
        }

        $subscription = $this->subscriptionRepository->subscribe($reader->id, $authorId);

        // Notify the author that a new reader subscribed
        \App\Jobs\SendSubscriptionNotificationJob::dispatch($author, $reader);

        return $subscription;
    }

    /**
     * Unsubscribe a reader from an author.
     */
    public function unsubscribe(User $reader, int $authorId): bool
    {
        return $this->subscriptionRepository->unsubscribe($reader->id, $authorId);
    }

    /**
     * Check if a reader is subscribed to an author.
     */
    public function isSubscribed(int $readerId, int $authorId): bool
    {
        return $this->subscriptionRepository->isSubscribed($readerId, $authorId);
    }

    /**
     * Get all subscribers of a given author.
     */
    public function getSubscribers(int $authorId, int $perPage = 15): LengthAwarePaginator
    {
        $author = $this->userRepository->findById($authorId);

        if (!$author) {
            abort(404, 'Author not found.');
        }

        return $this->subscriptionRepository->getSubscribers($authorId, $perPage);
    }

    /**
     * Get all authors a reader is subscribed to.
     */
    public function getSubscribedAuthors(User $reader, int $perPage = 15): LengthAwarePaginator
    {
        return $this->subscriptionRepository->getSubscribedAuthors($reader->id, $perPage);
    }
}
