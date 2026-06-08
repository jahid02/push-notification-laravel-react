<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {}

    /**
     * Display a listing of the users (filtered by role/search).
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['role', 'search']);
        $perPage = (int) $request->get('per_page', 15);

        $users = $this->userService->listUsers($filters, $perPage);

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    /**
     * Display the specified user details.
     */
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->getUserById($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Promote or demote a user's role (Admin only).
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'role' => 'required|string|in:admin,author,reader',
        ]);

        try {
            $user = $this->userService->updateUserRole($id, $request->input('role'), $request->user());

            return response()->json([
                'success' => true,
                'message' => "User role updated to '{$user->role}' successfully.",
                'data'    => [
                    'user' => $user,
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => $e->errors(),
            ], 422);
        }
    }

    /**
     * Delete a user account (Admin only).
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $this->userService->deleteUser($id, $request->user());

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'errors'  => $e->errors(),
            ], 422);
        }
    }
}
