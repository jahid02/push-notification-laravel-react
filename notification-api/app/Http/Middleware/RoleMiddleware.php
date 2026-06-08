<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Accepts one or more allowed roles as comma-separated parameters.
     *
     * Usage in routes:
     *   ->middleware('role:admin')
     *   ->middleware('role:admin,author')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!in_array($user->role, $roles, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Required role: ' . implode(' or ', $roles) . '.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
