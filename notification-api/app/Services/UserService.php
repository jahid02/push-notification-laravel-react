<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class UserService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * List users with optional role/search filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function listUsers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->userRepository->paginate($filters, $perPage);
    }

    /**
     * Get a single user by ID.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function getUserById(int $id): User
    {
        $user = $this->userRepository->findById($id);

        if (!$user) {
            abort(404, 'User not found.');
        }

        return $user;
    }

    /**
     * Promote or demote a user's role.
     *
     * @throws ValidationException
     */
    public function updateUserRole(int $userId, string $role, User $actor): User
    {
        $allowedRoles = ['admin', 'author', 'reader'];

        if (!in_array($role, $allowedRoles, true)) {
            throw ValidationException::withMessages([
                'role' => ['Role must be one of: ' . implode(', ', $allowedRoles)],
            ]);
        }

        // Prevent self-demotion for admins
        if ($actor->id === $userId && $actor->isAdmin() && $role !== 'admin') {
            throw ValidationException::withMessages([
                'role' => ['You cannot change your own admin role.'],
            ]);
        }

        return $this->userRepository->updateRole($userId, $role);
    }

    /**
     * Delete a user by ID.
     *
     * @throws ValidationException
     */
    public function deleteUser(int $userId, User $actor): bool
    {
        // Prevent self-deletion
        if ($actor->id === $userId) {
            throw ValidationException::withMessages([
                'id' => ['You cannot delete your own account.'],
            ]);
        }

        return $this->userRepository->delete($userId);
    }
}
