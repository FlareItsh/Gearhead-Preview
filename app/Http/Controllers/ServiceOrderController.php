<?php

namespace App\Http\Controllers;

use App\Models\QueueLine;
use App\Models\ServiceOrder;
use App\Models\ServiceVariant;
use App\Models\User;
use App\Repositories\Contracts\BayRepositoryInterface;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class ServiceOrderController extends Controller
{
    protected ServiceOrderRepositoryInterface $repo;

    protected EmployeeRepositoryInterface $employees;

    protected BayRepositoryInterface $bays;

    public function __construct(
        ServiceOrderRepositoryInterface $repo,
        EmployeeRepositoryInterface $employees,
        BayRepositoryInterface $bays
    ) {
        $this->repo = $repo;
        $this->employees = $employees;
        $this->bays = $bays;
    }

    public function index()
    {
        return response()->json($this->repo->all());
    }

    public function show(int $id)
    {
        $item = $this->repo->findById($id);

        return $item ? response()->json($item) : response()->json(['message' => 'Not found'], 404);
    }

    public function store(Request $request)
    {
        $data = $request->only(['user_id', 'employee_id', 'bay_id', 'status', 'order_date', 'order_type']);

        // Ensure user_id is the authenticated user when available
        if ($request->user()) {
            $data['user_id'] = $request->user()->user_id;
        }

        // Default order_date if not provided
        if (empty($data['order_date'])) {
            $data['order_date'] = now();
        }

        $details = $request->input('details');

        if (is_array($details) && count($details) > 0) {
            $created = $this->repo->createWithDetails($data, $details);
        } else {
            $created = $this->repo->create($data);
        }

        // Mark employee as assigned if provided
        if (! empty($data['employee_id'])) {
            $this->employees->updateAssignedStatus($data['employee_id'], 'assigned');
        }

        return response()->json($created, 201);
    }

    public function update(Request $request, int $id)
    {
        $item = $this->repo->findById($id);
        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $data = $request->all();

        // Handle service_ids update - replace all service details
        if (array_key_exists('variant_ids', $data)) {
            $variantIds = $data['variant_ids'];

            // Use repository to replace service order details using variants
            $this->repo->replaceServiceOrderDetailsWithVariants($id, $variantIds);

            // Remove variant_ids from data array
            unset($data['variant_ids']);
            if (isset($data['service_ids'])) {
                unset($data['service_ids']);
            }
        } elseif (array_key_exists('service_ids', $data)) {
            $serviceIds = $data['service_ids'];
            $this->repo->replaceServiceOrderDetails($id, $serviceIds);
            unset($data['service_ids']);
        }

        // Handle bay_id change - update bay status to occupied
        if (array_key_exists('bay_id', $data)) {
            $newBayId = $data['bay_id'];
            $oldBayId = $item->bay_id;

            // If bay is being assigned or changed
            if ($oldBayId != $newBayId) {
                // Mark old bay as available if there was one
                if ($oldBayId) {
                    $this->bays->updateStatus($oldBayId, 'available');
                }

                // Mark new bay as occupied
                if ($newBayId) {
                    $this->bays->updateStatus($newBayId, 'occupied');
                }
            }
        }

        // Handle employee_id change - update assigned status if needed
        if (array_key_exists('employee_id', $data)) {
            $newEmployeeId = $data['employee_id'];
            $oldEmployeeId = $item->employee_id;

            // If employee is being changed
            if ($oldEmployeeId != $newEmployeeId) {
                // Mark old employee as available if there was one
                if ($oldEmployeeId) {
                    $this->employees->updateAssignedStatus($oldEmployeeId, 'available');
                }

                // Mark new employee as assigned if there is one
                if ($newEmployeeId) {
                    $this->employees->updateAssignedStatus($newEmployeeId, 'assigned');
                }
            }
        }

        $this->repo->update($item, $data);

        // Remove from queue if assigned to a bay
        if (array_key_exists('bay_id', $data) && $data['bay_id']) {
            QueueLine::where('service_order_id', $id)->delete();
        }

        return response()->json($item);
    }

    public function destroy(int $id)
    {
        $item = $this->repo->findById($id);
        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->repo->delete($item);

        return response()->json(null, 204);
    }

    public function upcoming(Request $request)
    {
        try {
            $userId = $request->user()->user_id;

            $bookings = $this->repo->upcomingBookings($userId);

            return response()->json($bookings);
        } catch (\Exception $e) {
            Log::error('Error fetching upcoming bookings: '.$e->getMessage(), [
                'user_id' => $request->user() ? $request->user()->user_id : null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch upcoming bookings.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function pending()
    {
        $orders = $this->repo->getPendingOrders();

        return response()->json($orders->map(function ($order) {
            return [
                'service_order_id' => $order->service_order_id,
                'customer_name' => $order->customer_name,
                'service_name' => $order->service_name,
                'time' => $order->order_date,
                'status' => $order->status,
            ];
        }));
    }

    public function active()
    {
        // Get all active orders (pending or in_progress) with full relationships
        // This is for Registry page - shows all active bays
        $orders = $this->repo->getActiveOrders();

        Log::info('Active service orders:', [
            'count' => $orders->count(),
            'statuses' => $orders->pluck('status')->unique()->values(),
            'orders' => $orders->toArray(),
        ]);

        return response()->json($orders);
    }

    /**
     * Get today's pending bookings (reservations) with customer and service details
     */
    public function todayBookings()
    {
        $bookings = $this->repo->getTodayBookings();

        return response()->json($bookings);
    }

    /**
     * Get all bookings with optional date range filtering.
     */
    public function getBookings(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $search = $request->query('search');
        $status = $request->query('status');
        $perPage = (int) $request->query('per_page', 10);
        $sortBy = $request->query('sort_by', 'order_date');
        $sortOrder = $request->query('sort_order', 'asc');

        if ($request->has('per_page') || $search || $status || $sortBy) {
            return response()->json($this->repo->getPaginatedBookings($perPage, $search, $startDate, $endDate, $status, $sortBy, $sortOrder));
        }

        $bookings = $this->repo->getAllBookings($startDate, $endDate, $sortBy, $sortOrder);

        return response()->json($bookings);
    }

    /**
     * Book services for the authenticated user or guest.
     * Creates a service order with multiple service details.
     */
    public function book(Request $request)
    {
        $validated = $request->validate([
            'order_date' => [
                'required',
                'date_format:Y-m-d H:i',
                function ($attribute, $value, $fail) {
                    $date = Carbon::parse($value);
                    $time = $date->format('H:i');
                    // Opening: 06:30, Closing: 22:00
                    if ($time < '06:30' || $time > '22:00') {
                        $fail('The selected time must be between 6:30 AM and 10:00 PM.');
                    }
                },
            ],
            'variant_ids' => 'required|array|min:1',
            'variant_ids.*' => 'required|integer|exists:service_variants,service_variant',
            'guest_info' => 'nullable|array',
            'guest_info.name' => 'required_with:guest_info|string|min:2',
            'guest_info.email' => 'required_with:guest_info|email',
            'guest_info.phone' => 'required_with:guest_info|string|min:10',
            'guest_info.vehicleModel' => 'nullable|string',
            'car_id' => 'nullable|integer|exists:cars,car_id',
            'vehicle_make' => 'nullable|string|max:100',
            'vehicle_model' => 'nullable|string|max:100',
            'vehicle_size' => 'nullable|string|in:Small,Medium,Large,X-Large,XX-Large',
        ]);

        $user = $request->user();

        // Handle guest booking
        if (! $user && isset($validated['guest_info'])) {
            $guestInfo = $validated['guest_info'];

            // Try to find existing user by email
            $user = User::where('email', $guestInfo['email'])->first();

            // Create guest user if doesn't exist
            if (! $user) {
                // Parse name into first and last name
                $nameParts = explode(' ', trim($guestInfo['name']), 2);
                $firstName = $nameParts[0];
                $lastName = $nameParts[1] ?? '';

                $user = User::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $guestInfo['email'],
                    'phone_number' => $guestInfo['phone'],
                    'password' => Hash::make('gearhead2024'),
                    'role' => 'customer',
                    'email_verified_at' => now(),
                    'permissions' => [],
                ]);
            }
        }

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $orderData = [
            'user_id' => $user->user_id,
            'employee_id' => null,
            'bay_id' => null,
            'status' => 'pending',
            'order_date' => $validated['order_date'],
            'order_type' => 'R', // Reservation
            'car_id' => $validated['car_id'] ?? null,
            'vehicle_make' => $validated['vehicle_make'] ?? null,
            'vehicle_model' => $validated['vehicle_model'] ?? null,
            'vehicle_size' => $validated['vehicle_size'] ?? null,
        ];

        // Retrieve variants to get their service_id
        $variants = ServiceVariant::whereIn('service_variant', $validated['variant_ids'])->get()->keyBy('service_variant');

        // Check if a booking already exists for this user at the same date/time
        $existingOrder = $this->repo->findByUserAndDate($user->user_id, $validated['order_date']);
        if ($existingOrder) {
            // Check if it has the same services
            $existingDetails = $existingOrder->details->pluck('service_variant')->sort()->values();
            $requestedVariants = collect($validated['variant_ids'])->sort()->values();

            if ($existingDetails->toArray() === $requestedVariants->toArray()) {
                // Return the existing booking
                return response()->json($existingOrder, 200);
            }
        }

        // Map variant_ids to details format expected by createWithDetails
        $details = [];
        foreach ($validated['variant_ids'] as $variant_id) {
            if ($variant = $variants->get($variant_id)) {
                $details[] = [
                    'service_variant' => $variant_id,
                    'quantity' => 1,
                ];
            }
        }

        try {
            $order = $this->repo->createWithDetails($orderData, $details);

            return response()->json($order, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create booking', 'error' => $e->getMessage()], 500);
        }
    }

    public function createFromRegistry(Request $request)
    {
        if (! $request->user() || ! $request->user()->hasPermission('add_queue')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:users,user_id',
            'bay_id' => 'required|integer|exists:bays,bay_id',
            'variant_ids' => 'required|array|min:1',
            'variant_ids.*' => 'required|integer|exists:service_variants,service_variant',
            'employee_id' => 'nullable|integer|exists:employees,employee_id',
            'idempotency_key' => 'nullable|string',
        ]);

        try {
            // Idempotency check
            if ($request->has('idempotency_key')) {
                $existingOrder = ServiceOrder::where('idempotency_key', $request->input('idempotency_key'))->first();
                if ($existingOrder) {
                    return response()->json([
                        'message' => 'Service order already created',
                        'order' => $existingOrder->load('details.serviceVariant.service', 'user', 'bay', 'employee'),
                    ], 200);
                }
            }

            $orderData = [
                'user_id' => $validated['customer_id'],
                'employee_id' => $validated['employee_id'] ?? null,
                'bay_id' => $validated['bay_id'],
                'status' => 'in_progress',
                'order_date' => now(),
                'order_type' => 'W', // Walk-in
                'idempotency_key' => $request->input('idempotency_key'),
            ];

            // Retrieve variants to get their service_id
            $variants = ServiceVariant::whereIn('service_variant', $validated['variant_ids'])->get()->keyBy('service_variant');

            // Map variant_ids to details format
            $details = [];
            foreach ($validated['variant_ids'] as $variant_id) {
                if ($variant = $variants->get($variant_id)) {
                    $details[] = [
                        'service_variant' => $variant_id,
                        'quantity' => 1,
                    ];
                }
            }

            // Create the service order with details
            $order = $this->repo->createWithDetails($orderData, $details);

            // Mark employee as assigned if provided
            if (! empty($orderData['employee_id'])) {
                $this->employees->updateAssignedStatus($orderData['employee_id'], 'assigned');
            }

            // Update bay status to occupied
            $this->bays->updateStatus($validated['bay_id'], 'occupied');

            return response()->json([
                'message' => 'Service order created successfully',
                'order' => $order->load('details.serviceVariant.service', 'user', 'bay', 'employee'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create service order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Assign an employee to a service order
     */
    public function assignEmployee(Request $request, int $id)
    {
        if (! $request->user() || ! $request->user()->hasPermission('start_service')) {
            abort(403, 'Unauthorized action.');
        }

        try {
            $validated = $request->validate([
                'employee_id' => 'required|integer|exists:employees,employee_id',
            ]);

            $order = $this->repo->findById($id);
            if (! $order) {
                return response()->json(['message' => 'Service order not found'], 404);
            }

            // If there was a previous employee assigned, mark them as available
            if ($order->employee_id) {
                $this->employees->updateAssignedStatus($order->employee_id, 'available');
            }

            // Update the service order with new employee
            $this->repo->update($order, ['employee_id' => $validated['employee_id']]);

            // Mark the new employee as assigned
            $this->employees->updateAssignedStatus($validated['employee_id'], 'assigned');

            return response()->json([
                'message' => 'Employee assigned successfully',
                'order' => $order->load(['details.serviceVariant.service', 'user', 'bay', 'employee']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to assign employee',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
