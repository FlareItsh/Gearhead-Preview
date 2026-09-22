<?php

use App\Http\Middleware\AdminRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests; // <--- Add this use statement
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // API middleware should include session for authenticated routes
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // Add your custom middleware alias here
        $middleware->alias([
            // Add other core Laravel aliases here if they are not loaded by default,
            // but for role-based access, 'auth' and 'verified' are already assumed to be working.
            // Just add your custom role middleware.
            'role' => AdminRole::class, // <--- Add this line
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
