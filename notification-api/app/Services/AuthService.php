<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
    ) {}

    /**
     * Register a new user with default role 'reader'.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, access_token: string, refresh_token: string, token_type: string, expires_in: int}
     */
    public function register(array $data): array
    {
        $user = $this->userRepository->create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],   // auto-hashed via cast
            'role'     => 'reader',
        ]);

        return [
            'user'          => $user,
            'access_token'  => $this->generateAccessToken($user),
            'refresh_token' => $this->generateRefreshToken($user),
            'token_type'    => 'Bearer',
            'expires_in'    => config('jwt.ttl'),
        ];
    }

    /**
     * Authenticate a user and return JWT tokens.
     *
     * @param  array<string, mixed>  $data
     * @return array{user: User, access_token: string, refresh_token: string, token_type: string, expires_in: int}
     *
     * @throws ValidationException
     */
    public function login(array $data): array
    {
        $user = $this->userRepository->findByEmail($data['email']);

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return [
            'user'          => $user,
            'access_token'  => $this->generateAccessToken($user),
            'refresh_token' => $this->generateRefreshToken($user),
            'token_type'    => 'Bearer',
            'expires_in'    => config('jwt.ttl'),
        ];
    }

    /**
     * Issue a new access token using a valid refresh token.
     *
     * @return array{user: User, access_token: string, token_type: string, expires_in: int}
     *
     * @throws ValidationException
     */
    public function refresh(string $refreshToken): array
    {
        try {
            $decoded = JWT::decode(
                $refreshToken,
                new Key(config('jwt.secret'), config('jwt.algo', 'HS256'))
            );

            if (($decoded->type ?? '') !== 'refresh') {
                throw new \UnexpectedValueException('Not a refresh token');
            }

            $user = $this->userRepository->findById((int) $decoded->sub);

            if (!$user) {
                throw new \UnexpectedValueException('User not found');
            }

            return [
                'user'          => $user,
                'access_token'  => $this->generateAccessToken($user),
                'refresh_token' => $this->generateRefreshToken($user),
                'token_type'    => 'Bearer',
                'expires_in'    => config('jwt.ttl'),
            ];

        } catch (\Throwable $e) {
            throw ValidationException::withMessages([
                'refresh_token' => ['Invalid or expired refresh token.'],
            ]);
        }
    }

    /**
     * Generate a short-lived JWT access token.
     */
    public function generateAccessToken(User $user): string
    {
        $now     = time();
        $payload = [
            'iss'  => config('app.url'),
            'sub'  => $user->id,
            'iat'  => $now,
            'exp'  => $now + config('jwt.ttl', 3600),
            'type' => 'access',
            'role' => $user->role,
        ];

        return JWT::encode($payload, config('jwt.secret'), config('jwt.algo', 'HS256'));
    }

    /**
     * Generate a long-lived JWT refresh token.
     */
    public function generateRefreshToken(User $user): string
    {
        $now     = time();
        $payload = [
            'iss'  => config('app.url'),
            'sub'  => $user->id,
            'iat'  => $now,
            'exp'  => $now + config('jwt.refresh_ttl', 1209600),
            'type' => 'refresh',
        ];

        return JWT::encode($payload, config('jwt.secret'), config('jwt.algo', 'HS256'));
    }

    /**
     * Update user profile info.
     */
    public function updateProfile(int $userId, array $data): User
    {
        return $this->userRepository->update($userId, $data);
    }

    /**
     * Update user password.
     */
    public function updatePassword(int $userId, string $hashedPassword): User
    {
        return $this->userRepository->update($userId, ['password' => $hashedPassword]);
    }
}
