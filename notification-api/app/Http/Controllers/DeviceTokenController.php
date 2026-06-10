<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\DeviceTokenRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    public function __construct(
        private readonly DeviceTokenRepositoryInterface $deviceTokenRepository
    ) {}

    /**
     * Admin: Paginated list of all registered device tokens.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search']);
        $perPage = (int) $request->get('per_page', 15);

        $tokens = $this->deviceTokenRepository->paginateAll($filters, $perPage);

        return response()->json([
            'success' => true,
            'data'    => $tokens,
        ]);
    }

    /**
     * Register or update an FCM token for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token'       => 'required|string',
            'platform'    => 'nullable|string|in:web,android,ios',
            'device_name' => 'nullable|string|max:255',
        ]);

        $data['user_id'] = $request->user()->id;

        $deviceToken = $this->deviceTokenRepository->createOrUpdate($data);

        return response()->json([
            'success' => true,
            'message' => 'Device token registered successfully.',
            'data'    => [
                'device_token' => $deviceToken,
            ],
        ], 201);
    }

    /**
     * Remove an FCM token (e.g. on logout).
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $deleted = $this->deviceTokenRepository->deleteByToken($request->input('token'));

        return response()->json([
            'success' => true,
            'message' => $deleted ? 'Device token removed successfully.' : 'Device token not found.',
        ]);
    }

    /**
     * Admin: Remove a specific device token by its database ID.
     */
    public function destroyById(int $id): JsonResponse
    {
        $token = $this->deviceTokenRepository->findById($id);

        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'Device token not found.',
            ], 404);
        }

        $this->deviceTokenRepository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Device token removed from notification list successfully.',
        ]);
    }
}

