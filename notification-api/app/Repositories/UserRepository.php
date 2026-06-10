<?php

namespace App\Repositories;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        return User::create($data);
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function updateRole(int $userId, string $role): User
    {
        $user = User::findOrFail($userId);
        $user->update(['role' => $role]);

        return $user->fresh();
    }

    public function update(int $userId, array $data): User
    {
        $user = User::findOrFail($userId);
        $user->update($data);

        return $user->fresh();
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::query()->withCount('subscribers')->latest();

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('email', 'like', $search);
            });
        }

        return $query->paginate($perPage);
    }

    public function delete(int $userId): bool
    {
        return (bool) User::destroy($userId);
    }
}
