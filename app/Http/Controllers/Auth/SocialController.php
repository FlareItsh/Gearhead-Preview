<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class SocialController extends Controller
{
    public function __construct(protected UserRepositoryInterface $users) {}

    /**
     * Redirect to the Google authentication page.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->with('error', 'Google authentication failed.');
        }

        // Try to find user by google_id
        $user = User::where('google_id', $googleUser->getId())->first();

        if ($user) {
            // Update tokens
            $user->update([
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
            ]);
        } else {
            // Try to find by email
            $user = $this->users->findByEmail($googleUser->getEmail());

            if ($user) {
                // Link Google to existing account
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'google_token' => $googleUser->token,
                    'google_refresh_token' => $googleUser->refreshToken,
                ]);
            } else {
                // Split name (Google usually provides name)
                $nameParts = explode(' ', $googleUser->getName(), 2);
                $firstName = $nameParts[0] ?? '';
                $lastName = $nameParts[1] ?? '';

                // Create new user
                $user = User::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'google_token' => $googleUser->token,
                    'google_refresh_token' => $googleUser->refreshToken,
                    'role' => 'customer',
                    'permissions' => ['view_dashboard', 'manage_own_bookings'], // Default customer permissions
                    'password' => null, // Social only by default
                ]);

                event(new Registered($user));
            }
        }

        Auth::login($user);

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
