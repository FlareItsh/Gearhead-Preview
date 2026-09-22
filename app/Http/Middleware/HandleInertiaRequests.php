<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use App\Models\Discount;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user() ? [
                    'user_id' => $request->user()->user_id,
                    'first_name' => $request->user()->first_name,
                    'last_name' => $request->user()->last_name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'permissions' => $request->user()->permissions,
                    'has_password' => $request->user()->password !== null,
                ] : null,
            ],
            'loyaltyThreshold' => (function () {
                try {
                    return (int) (AppSetting::where('key', 'loyalty_free_wash_threshold')->value('value') ?? 9);
                } catch (\Exception) {
                    return 9;
                }
            })(),
            'activeDiscounts' => (function () {
                try {
                    return Discount::active()->with('services')->get();
                } catch (\Exception) {
                    return collect();
                }
            })(),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
