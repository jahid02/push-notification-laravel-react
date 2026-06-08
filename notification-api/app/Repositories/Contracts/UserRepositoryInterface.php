<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface UserRepositoryInterface
{
    /**
     * Create a new user.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User;

    /**
     * Find a user by their ID.
     */
    public function findById(int $id): ?User;

    /**
     * Find a user by their email address.
     */
    public function findByEmail(string $email): ?User;

    /**
     * Update the role of a user.
     *
     * @param  string  $role  admin|author|reader
     */
    public function updateRole(int $userId, string $role): User;

    /**
     * Return a paginated list of all users, with optional filters.
     *
     * @param  array<string, mixed>  $filters  e.g. ['role' => 'author', 'search' => 'john']
     */
    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Delete a user by ID.
     */
    public function delete(int $userId): bool;
}
