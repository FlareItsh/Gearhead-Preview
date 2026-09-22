<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use App\Repositories\BookingRepository;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class CustomerController extends Controller
{
    private UserRepositoryInterface $users;

    private PaymentRepositoryInterface $payments;

    private ServiceRepositoryInterface $services;

    private ServiceOrderRepositoryInterface $serviceOrders;

    public function __construct(
        UserRepositoryInterface $users,
        PaymentRepositoryInterface $payments,
        ServiceRepositoryInterface $services,
        ServiceOrderRepositoryInterface $serviceOrders
    ) {
        $this->users = $users;
        $this->payments = $payments;
        $this->services = $services;
        $this->serviceOrders = $serviceOrders;
    }

    public function bookings(Request $request, BookingRepository $bookings)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $status = $request->query('status', 'all');
        $perPage = (int) $request->query('per_page', 9);

        // Get paginated bookings
        $paginatedBookings = $bookings->getBookingsByUser((int) $user->user_id, $status, $perPage);

        return Inertia::render('Customer/Bookings', [
            'bookings' => $paginatedBookings,
            'filters' => [
                'status' => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function payments(Request $request)
    {
        $users = $this->users->all();

        return Inertia::render('Customer/Payments', [
            'users' => $users,
        ]);
    }

    /**
     * Show the customer dashboard page with data scoped to the authenticated user.
     */
    public function dashboard(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $userId = $user->user_id ?? $user->id ?? null;
        $count = 0;
        $total = 0;

        if ($userId !== null) {
            $count = $this->payments->countByUserId((int) $userId);
            $total = $this->payments->totalSpent((int) $userId);
        }

        return Inertia::render('dashboard', [
            'paymentsCount' => $count,
            'totalSpent' => $total,
            'discounts' => Discount::advertisable()->get(),
        ]);
    }

    /**
     * Show all services or filtered by category.
     */
    public function services(Request $request)
    {
        $selectedCategory = $request->query('category', 'All');

        // Get services filtered by category
        $services = $this->services->getAllByCategory($selectedCategory);

        // Get all unique categories (for category buttons)
        $categories = $this->services->all()->pluck('category')->unique()->values();

        /** @var \App\Models\User|null $user */
        $user = $request->user();
        $cars = $user ? $user->cars()->orderByDesc('created_at')->get() : [];

        return Inertia::render('Customer/Services', [
            'services' => $services,
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
            'cars' => $cars,
        ]);
    }

    public function cancelBooking(Request $request, int $id)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Find the booking using repository
        $booking = $this->serviceOrders->findById($id);

        if (! $booking || $booking->user_id != $user->user_id) {
            return back()->with('error', 'Booking not found.');
        }

        // Check if it can be cancelled
        if (in_array($booking->status, ['completed', 'confirmed'])) {
            return back()->with('error', 'This booking cannot be cancelled.');
        }

        // Update status to cancelled using repository
        $this->serviceOrders->cancelBooking($id);

        return back()->with('success', 'Booking cancelled successfully.');
    }

    public function getCustomers(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        $search = $request->query('search');
        $role = $request->query('role');

        if ($request->has('per_page') || $search || $role) {
            $paginated = $this->users->getPaginatedCustomers($perPage, $search, $role);
            // decode permissions json for response
            foreach ($paginated->items() as $item) {
                if ($item->permissions) {
                    $item->permissions = json_decode($item->permissions, true);
                } else {
                    $item->permissions = [];
                }
            }

            return response()->json($paginated);
        }

        $customers = $this->users->getCustomersWithBookings();

        return response()->json($customers);
    }

    /**
     * Get all customers for the registry API
     */
    public function index()
    {
        $customers = $this->users->all()->map(function ($customer) {
            return [
                'user_id' => $customer->user_id,
                'first_name' => $customer->first_name,
                'last_name' => $customer->last_name,
                'email' => $customer->email,
                'phone_number' => $customer->phone_number,
            ];
        });

        return response()->json($customers);
    }

    /**
     * Store a new customer for the registry
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'nullable|string|email|max:255|unique:users,email',
            'phone_number' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'password' => 'required|string|min:8',
        ]);

        $customer = $this->users->create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone_number' => $validated['phone_number'],
            'address' => $validated['address'],
            'password' => $validated['password'],
            'role' => 'customer',
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'user_id' => $customer->user_id,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'email' => $customer->email,
            'phone_number' => $customer->phone_number,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        /** @var \App\Models\User $authUser */
        $authUser = $request->user();

        if (! $authUser || ! $authUser->hasPermission('edit_user')) {
            return response()->json(['message' => 'Unauthorized action.'], 403);
        }

        $user = $this->users->findById($id);

        if (! $user) {
            return back()->with('error', 'User not found.');
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$id.',user_id',
            'phone_number' => 'nullable|string|max:20',
            'role' => 'required|string|in:admin,customer',
            'permissions' => 'nullable|array',
            'password' => 'nullable|string|min:8',
            'admin_password' => 'required|string',
        ]);

        // Verify admin password
        if (! Hash::check($validated['admin_password'], $authUser->password)) {
            return response()->json([
                'message' => 'Incorrect admin password provided.',
            ], 403);
        }

        if (empty($validated['password'])) {
            unset($validated['password']);
        }
        unset($validated['admin_password']); // Don't try to update user with this

        $this->users->update($user, $validated);

        return response()->json(['message' => 'Customer updated successfully.']);
    }

    public function storeReview(Request $request)
    {
        $validated = $request->validate([
            'comment' => 'required|string|max:1000',
            'rating' => 'required|integer|min:1|max:5',
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        \App\Models\Review::create([
            'user_id' => $user->user_id,
            'name' => $user->first_name.' '.$user->last_name,
            'comment' => $validated['comment'],
            'rating' => $validated['rating'],
            'is_displayed' => false, // Needs moderation
            'is_verified' => true,
        ]);

        return back()->with('status', 'review-submitted');
    }
}
