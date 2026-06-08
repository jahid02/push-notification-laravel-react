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
}
