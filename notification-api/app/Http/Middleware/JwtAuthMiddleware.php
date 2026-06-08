<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\SignatureInvalidException;
use Firebase\JWT\BeforeValidException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use UnexpectedValueException;

class JwtAuthMiddleware
{
    /**
     * Handle an incoming request.
     * Validates the Bearer JWT token and attaches the resolved user to the request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'Authorization token not provided.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $token = substr($authHeader, 7);

        try {
            $secret = config('jwt.secret');
            $algo   = config('jwt.algo', 'HS256');

            $decoded = JWT::decode($token, new Key($secret, $algo));

            // Ensure the token type is "access" (not refresh)
            if (isset($decoded->type) && $decoded->type !== 'access') {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid token type. Use your access token.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            $user = User::find($decoded->sub);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.',
                ], Response::HTTP_UNAUTHORIZED);
            }

            // Attach user to the request for downstream access
            $request->setUserResolver(fn() => $user);

        } catch (ExpiredException) {
            return response()->json([
                'success' => false,
                'message' => 'Token has expired.',
            ], Response::HTTP_UNAUTHORIZED);

        } catch (SignatureInvalidException) {
            return response()->json([
                'success' => false,
                'message' => 'Token signature is invalid.',
            ], Response::HTTP_UNAUTHORIZED);

        } catch (BeforeValidException) {
            return response()->json([
                'success' => false,
                'message' => 'Token is not yet valid.',
            ], Response::HTTP_UNAUTHORIZED);

        } catch (UnexpectedValueException) {
            return response()->json([
                'success' => false,
                'message' => 'Token is malformed.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $next($request);
    }
}
