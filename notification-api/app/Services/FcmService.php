<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    /**
     * Send a push notification to a specific device token using FCM v1 HTTP API.
     * Fallbacks to mock mode if credentials or project ID are not configured.
     *
     * @param  string  $deviceToken
     * @param  string  $title
     * @param  string  $body
     * @param  string|null  $imageUrl
     * @param  array  $data
     * @return array{success: bool, message_id: string|null, error: string|null}
     */
    public function sendNotification(
        string $deviceToken,
        string $title,
        string $body,
        ?string $imageUrl = null,
        array $data = []
    ): array {
        $projectId = config('fcm.project_id');
        $credentialsPath = config('fcm.credentials_path');
        $isMock = env('FCM_MOCK', false) || empty($projectId) || !file_exists($credentialsPath);

        if ($isMock) {
            return $this->sendMockNotification($deviceToken, $title, $body, $imageUrl, $data);
        }

        try {
            $accessToken = $this->getAccessToken($credentialsPath);
            $url = str_replace('{project_id}', $projectId, config('fcm.endpoint'));

            // Build payload according to FCM v1 schema
            $payload = [
                'message' => [
                    'token' => $deviceToken,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                ]
            ];

            // Add custom data if present
            if (!empty($data)) {
                // FCM v1 requires all values in the data object to be strings
                $stringData = array_map('strval', $data);
                $payload['message']['data'] = $stringData;
            }

            // Add image URL if present for various platforms
            if (!empty($imageUrl)) {
                // Android specific configuration
                $payload['message']['android'] = [
                    'notification' => [
                        'image' => $imageUrl,
                    ],
                ];

                // iOS/APNS specific configuration
                $payload['message']['apns'] = [
                    'payload' => [
                        'aps' => [
                            'mutable-content' => 1,
                        ],
                    ],
                    'fcm_options' => [
                        'image' => $imageUrl,
                    ],
                ];

                // Web Push specific configuration
                $payload['message']['webpush'] = [
                    'notification' => [
                        'image' => $imageUrl,
                    ],
                ];
            }

            $response = Http::withToken($accessToken)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, $payload);

            if ($response->successful()) {
                $responseBody = $response->json();
                // Response pattern: { "name": "projects/{project_id}/messages/{message_id}" }
                $name = $responseBody['name'] ?? '';
                $messageId = last(explode('/', $name)) ?: 'fcm_msg_' . uniqid();

                return [
                    'success' => true,
                    'message_id' => $messageId,
                    'error' => null,
                ];
            }

            // Handle FCM error responses
            $errorJson = $response->json();
            $errorMessage = $errorJson['error']['message'] ?? $response->body() ?: 'Unknown FCM Error';

            Log::error('FCM Send Failed', [
                'token' => $deviceToken,
                'status' => $response->status(),
                'error' => $errorMessage,
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $errorMessage,
            ];

        } catch (\Exception $e) {
            Log::error('FCM Service Exception', [
                'token' => $deviceToken,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'message_id' => null,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Fetch the OAuth2 access token for Google API Client.
     * Uses cache to avoid fetching token for every API call.
     */
    private function getAccessToken(string $credentialsPath): string
    {
        return Cache::remember('fcm_access_token', 3500, function () use ($credentialsPath) {
            $client = new \Google\Client();
            $client->setAuthConfig($credentialsPath);
            $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
            
            $tokenArray = $client->fetchAccessTokenWithAssertion();
            
            if (isset($tokenArray['access_token'])) {
                return $tokenArray['access_token'];
            }
            
            throw new \RuntimeException('Failed to fetch OAuth2 token from Google API: ' . json_encode($tokenArray));
        });
    }

    /**
     * Simulate sending push notification.
     */
    private function sendMockNotification(
        string $deviceToken,
        string $title,
        string $body,
        ?string $imageUrl = null,
        array $data = []
    ): array {
        // Simulate minor network delay
        usleep(50000); 

        // Generate a random successful ID or fail if token is deliberately "invalid-token"
        if ($deviceToken === 'invalid-token-test') {
            return [
                'success' => false,
                'message_id' => null,
                'error' => 'The registration token is not a valid FCM registration token.',
            ];
        }

        return [
            'success' => true,
            'message_id' => 'mock_fcm_msg_' . uniqid() . '_' . time(),
            'error' => null,
        ];
    }
}
