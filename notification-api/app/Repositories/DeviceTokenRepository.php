<?php

namespace App\Repositories;

use App\Models\DeviceToken;
use App\Repositories\Contracts\DeviceTokenRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DeviceTokenRepository implements DeviceTokenRepositoryInterface
{
    public function createOrUpdate(array $data): DeviceToken
    {
        return DeviceToken::updateOrCreate(
            // Match by token string (unique across users)
            ['token' => $data['token']],
            // Update or set all provided fields
            [
                'user_id'     => $data['user_id'],
                'platform'    => $data['platform'] ?? 'web',
                'device_name' => $data['device_name'] ?? null,
                'last_used_at' => now(),
            ]
        );
    }

    public function findById(int $id): ?DeviceToken
    {
        return DeviceToken::find($id);
    }

    public function findByToken(string $token): ?DeviceToken
    {
        return DeviceToken::where('token', $token)->first();
    }

    public function getByUser(int $userId): Collection
    {
        return DeviceToken::where('user_id', $userId)
                          ->latest()
                          ->get();
    }

    public function getTokensForUsers(array $userIds): Collection
    {
        if (empty($userIds)) {
            return new Collection();
        }

        return DeviceToken::whereIn('user_id', $userIds)
                          ->get();
    }

    public function delete(int $id): bool
    {
        return (bool) DeviceToken::destroy($id);
    }

    public function deleteByToken(string $token): bool
    {
        return (bool) DeviceToken::where('token', $token)->delete();
    }
}
