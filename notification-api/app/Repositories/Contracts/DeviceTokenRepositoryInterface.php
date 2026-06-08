<?php

namespace App\Repositories\Contracts;

use App\Models\DeviceToken;
use Illuminate\Database\Eloquent\Collection;

interface DeviceTokenRepositoryInterface
{
    /**
     * Register a new device token for a user.
     * If the token already exists, update its metadata.
     *
     * @param  array<string, mixed>  $data  Must include user_id, token, platform
     */
    public function createOrUpdate(array $data): DeviceToken;

    /**
     * Find a device token record by its ID.
     */
    public function findById(int $id): ?DeviceToken;

    /**
     * Find a device token by its raw FCM token string.
     */
    public function findByToken(string $token): ?DeviceToken;

    /**
     * Get all device tokens registered for a given user.
     *
     * @return Collection<int, DeviceToken>
     */
    public function getByUser(int $userId): Collection;

    /**
     * Get all device tokens for a list of user IDs.
     * Used by the notification job to resolve tokens for subscribers.
     *
     * @param  array<int>  $userIds
     * @return Collection<int, DeviceToken>
     */
    public function getTokensForUsers(array $userIds): Collection;

    /**
     * Delete a device token by its ID.
     */
    public function delete(int $id): bool;

    /**
     * Delete a device token by its raw FCM token string.
     * Used to clean up stale/invalidated tokens reported by FCM.
     */
    public function deleteByToken(string $token): bool;
}
