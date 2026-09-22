<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  // Accept multiple roles as variadic arguments
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! Auth::check()) {
            // Redirect to login or a public page if not authenticated
            return redirect()->route('login')->with('error', 'Please log in to access this page.');
        }

        $user = Auth::user();

        if (! $user->hasAnyRole($roles)) {
            // If the user does not have any of the specified roles
            // Redirect to the dashboard (no role-based homepage)
            return redirect()->route('dashboard')->with('error', 'You do not have permission to access this page.');
        }

        // If authenticated and has the required role(s), proceed with the request
        return $next($request);
    }
}
