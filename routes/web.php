<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CustomerController;
use App\Models\Bay;
use App\Repositories\BookingRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// * Public Routes
Route::get('/', function () {
    return Inertia::render('welcome', [
        'discounts' => \App\Models\Discount::advertisable()->get(),
        'reviews' => \App\Models\Review::where('is_displayed', true)->orderBy('created_at', 'desc')->get(),
    ]);
})->name('home');

// * Guest-accessible booking route
Route::get('/services', function (Request $request, AdminController $admin, CustomerController $customer) {
    $user = $request->user();

    // If user is admin, show admin services page
    if ($user && method_exists($user, 'hasRole') && $user->hasRole('admin')) {
        return $admin->services($request);
    }

    // Otherwise show customer services page (works for both authenticated customers and guests)
    return $customer->services($request);
})->name('services');

// * Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', [AdminController::class, 'dashboard'])->name('dashboard');

    Route::get('customer-dashboard', [CustomerController::class, 'dashboard'])
        ->name('customer.dashboard');

    // * Role-aware shared routes
    Route::get('/bookings', function (Request $request, AdminController $admin, CustomerController $customer) {
        $user = $request->user();
        if ($user && method_exists($user, 'hasRole') && $user->hasRole('admin')) {
            return $admin->bookings($request);
        }
        $bookingRepo = app(BookingRepository::class);

        return $customer->bookings($request, $bookingRepo);
    })->name('bookings');

    // * Customer-specific routes
    Route::get('/payments', [CustomerController::class, 'payments'])
        ->name('customer.payments')
        ->middleware('auth', 'role:customer');

    Route::put('/customers/{id}', [CustomerController::class, 'update'])->name('customers.update');
    Route::get('/api/customers', [CustomerController::class, 'index'])->name('customers.index');

    // * Admin Specific routes
    Route::get('/registry', [AdminController::class, 'registry'])
        ->name('admin.registry')
        ->middleware('role:admin');

    Route::get('/registry/queue/select-services', function () {
        return Inertia::render('Admin/RegistrySelectServices', [
            'isQueue' => true,
        ]);
    })->name('admin.registry.queue.select-services')->middleware('role:admin');

    Route::get('/registry/{bayId}/select-services', function ($bayId) {
        // Get bay details from database
        $bay = Bay::find($bayId);
        if (! $bay) {
            abort(404, 'Bay not found');
        }

        return Inertia::render('Admin/RegistrySelectServices', [
            'bayId' => (int) $bayId,
            'bayNumber' => (int) $bay->bay_number,
        ]);
    })->name('admin.registry.select-services')->middleware('role:admin');

    // THIS IS THE ONLY LINE YOU NEED TO CHANGE
    Route::get('/registry/{id}/payment', function ($id) {
        $gcashSettings = \App\Models\GcashSetting::first();

        return Inertia::render('Admin/RegistryPayment', [
            'bayId' => (int) $id,
            'gcashSettings' => $gcashSettings,
        ]);
    })->name('admin.registry.payment')->middleware('role:admin');

    Route::get('/customers', [AdminController::class, 'customers'])
        ->name('admin.customers')
        ->middleware('role:admin');

    Route::get('/inventory', [AdminController::class, 'inventory'])
        ->name('admin.inventory')
        ->middleware('role:admin');

    Route::get('/pullout-requests-page', function () {
        return Inertia::render('Admin/PulloutRequests');
    })
        ->name('admin.pullout-requests')
        ->middleware('role:admin');

    Route::get('/transactions', [AdminController::class, 'transactions'])
        ->name('admin.transactions')
        ->middleware('role:admin');

    Route::get('/reports', [AdminController::class, 'reports'])
        ->name('admin.reports')
        ->middleware('role:admin');

    Route::get('/bays', [AdminController::class, 'bays'])
        ->name('admin.bays')
        ->middleware('role:admin');

    // Moderation
    Route::group(['middleware' => 'role:admin'], function () {
        Route::get('/moderation', [\App\Http\Controllers\ModerationController::class, 'index'])->name('admin.moderation');
        Route::post('/moderation/loyalty', [\App\Http\Controllers\ModerationController::class, 'updateLoyalty'])->name('admin.moderation.loyalty');
        Route::post('/moderation/gcash', [\App\Http\Controllers\ModerationController::class, 'updateGcash'])->name('admin.moderation.gcash');
        Route::post('/moderation/discounts', [\App\Http\Controllers\ModerationController::class, 'storeDiscount'])->name('admin.moderation.discounts.store');
        Route::put('/moderation/discounts/{id}', [\App\Http\Controllers\ModerationController::class, 'updateDiscount'])->name('admin.moderation.discounts.update');
        Route::delete('/moderation/discounts/{id}', [\App\Http\Controllers\ModerationController::class, 'destroyDiscount'])->name('admin.moderation.discounts.destroy');
        Route::post('/moderation/reviews/{id}/toggle', [\App\Http\Controllers\ModerationController::class, 'toggleReview'])->name('admin.moderation.reviews.toggle');
        Route::delete('/moderation/reviews/{id}', [\App\Http\Controllers\ModerationController::class, 'destroyReview'])->name('admin.moderation.reviews.destroy');
    });

    Route::post('/reviews', [CustomerController::class, 'storeReview'])->name('reviews.store');
});

// * Auth routes
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/api.php';
