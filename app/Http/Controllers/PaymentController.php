<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use App\Models\Discount;
use App\Models\QueueLine;
use App\Repositories\Contracts\BayRepositoryInterface;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    protected PaymentRepositoryInterface $repo;

    protected ServiceOrderRepositoryInterface $serviceOrders;

    protected EmployeeRepositoryInterface $employees;

    protected BayRepositoryInterface $bays;

    public function __construct(
        PaymentRepositoryInterface $repo,
        ServiceOrderRepositoryInterface $serviceOrders,
        EmployeeRepositoryInterface $employees,
        BayRepositoryInterface $bays
    ) {
        $this->repo = $repo;
        $this->serviceOrders = $serviceOrders;
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
        $created = $this->repo->create($request->all());

        return response()->json($created, 201);
    }

    public function update(Request $request, int $id)
    {
        $item = $this->repo->findById($id);
        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->repo->update($item, $request->all());

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

    /**
     * Return the total number of payments for the currently authenticated user.
     */
    public function countForCurrentUser(Request $request)
    {
        $user = $request->user();
        $userId = $user->user_id ?? $user->id ?? null;
        $count = 0;

        if ($userId !== null) {
            $count = $this->repo->countByUserId((int) $userId);
        }

        return response()->json(['payments_count' => $count]);
    }

    // Method to get payments for current logged-in user
    public function indexForCurrentUser(Request $request)
    {
        try {
            $userId = Auth::id();

            if (! $userId) {
                return response()->json([
                    'paginated' => [
                        'data' => [],
                    ],
                    'summary' => [
                        'total_spent' => 0,
                        'total_count' => 0,
                    ],
                ]);
            }

            $perPage = (int) $request->query('per_page', 10);
            $export = $request->query('export') === 'true';

            if ($export) {
                $payments = $this->repo->getPaymentsForUser($userId);

                return response()->json($payments);
            }

            $payments = $this->repo->getPaginatedPaymentsForUser($userId, $perPage);
            $totalSpent = $this->repo->totalSpent($userId);
            $totalCount = $this->repo->countByUserId($userId);

            return response()->json([
                'paginated' => $payments,
                'summary' => [
                    'total_spent' => $totalSpent,
                    'total_count' => $totalCount,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching payments for user: '.$e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch payments data.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Display sum and count of payments within a date range.
     */
    public function summary(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $summary = $this->repo->getSummaryByDateRange(
            $request->start_date,
            $request->end_date
        );

        return response()->json(array_merge($summary, [
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
        ]));
    }

    /**
     * Get monthly revenue for a specific year.
     */
    public function monthlyRevenueByYear(Request $request)
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:'.date('Y'),
        ]);

        $data = $this->repo->getMonthlyRevenueByYear($request->year);

        return response()->json($data);
    }

    /**
     * Get financial summary (revenue, expenses, profit) by date range.
     */
    public function financialSummaryByDateRange(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $data = $this->repo->getFinancialSummaryByDateRange(
            $request->start_date,
            $request->end_date
        );

        return response()->json($data);
    }

    /**
     * Get average booking value by date range.
     */
    public function averageBookingValueByDateRange(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $value = $this->repo->getAverageBookingValueByDateRange(
            $request->start_date,
            $request->end_date
        );

        return response()->json(['average_booking_value' => $value]);
    }

    /**
     * Get customer retention rate by date range.
     */
    public function customerRetentionRateByDateRange(Request $request)
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $rate = $this->repo->getCustomerRetentionRateByDateRange(
            $request->start_date,
            $request->end_date
        );

        return response()->json(['retention_rate' => $rate]);
    }

    /**
     * Check if customer is eligible for loyalty point redemption
     */
    private function checkLoyaltyEligibility(int $userId): bool
    {
        // Count completed service orders with payments for this user
        $completedBookings = $this->serviceOrders->countCompletedBookingsForUser($userId);

        $threshold = (int) (AppSetting::where('key', 'loyalty_free_wash_threshold')->value('value') ?? 9);

        // Check if next booking would be the threshold (0, 9, 18, 27, etc.)
        return ($completedBookings + 1) % $threshold === 0;
    }

    /**
     * Check loyalty eligibility for a specific user (public endpoint)
     */
    public function checkLoyalty(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,user_id',
        ]);

        $userId = $validated['user_id'];
        $completedBookings = $this->serviceOrders->countCompletedBookingsForUser($userId);

        $threshold = (int) (AppSetting::where('key', 'loyalty_free_wash_threshold')->value('value') ?? 9);

        $isEligible = ($completedBookings + 1) % $threshold === 0;
        $pointsEarned = $completedBookings % $threshold;

        return response()->json([
            'is_eligible' => $isEligible,
            'completed_bookings' => $completedBookings,
            'points_earned' => $pointsEarned,
            'points_needed' => $threshold - $pointsEarned,
            'threshold' => $threshold,
        ]);
    }

    /**
     * Process a payment and update service order and bay status
     */
    public function process(Request $request)
    {
        try {
            // Check if loyalty points are being used (can be string 'true' from FormData)
            $useLoyalty = $request->input('use_loyalty_points');
            $isLoyaltyRedemption = $useLoyalty === 'true' || $useLoyalty === true || $useLoyalty === 1;

            $validated = $request->validate([
                'service_order_id' => 'required|integer|exists:service_orders,service_order_id',
                'bay_id' => 'required|integer|exists:bays,bay_id',
                'payment_method' => $isLoyaltyRedemption ? 'nullable|in:cash,gcash,loyalty' : 'required|in:cash,gcash,loyalty',
                'amount' => $isLoyaltyRedemption ? 'nullable|numeric|min:0' : 'required|numeric|min:0',
                'gcash_reference' => 'nullable|string',
                'gcash_screenshot' => 'nullable|image|max:5120', // 5MB max
                'use_loyalty_points' => 'nullable',
                'employee_id' => 'nullable|exists:employees,employee_id',
            ]);

            // Get service order to check user
            $serviceOrder = $this->serviceOrders->findById($validated['service_order_id']);

            if (! $serviceOrder) {
                return response()->json(['message' => 'Service order not found'], 404);
            }

            // Check loyalty eligibility and automatically apply it if eligible
            $isEligibleForLoyalty = $this->checkLoyaltyEligibility($serviceOrder->user_id);

            if ($isEligibleForLoyalty) {
                $isLoyaltyRedemption = true;
            }

            // If loyalty redemption was requested but NOT eligible (shouldn't happen with auto-apply but for safety)
            if ($useLoyalty === 'true' && ! $isEligibleForLoyalty) {
                return response()->json([
                    'message' => 'Customer is not eligible for loyalty point redemption',
                ], 422);
            }

            // Handle file upload
            $screenshotPath = null;
            if ($request->hasFile('gcash_screenshot')) {
                $file = $request->file('gcash_screenshot');
                $filename = 'receipt_'.time().'_'.uniqid().'.'.$file->getClientOriginalExtension();
                $screenshotPath = $file->storeAs('receipts', $filename, 'public');
            }

            // Calculate total and apply discount if not loyalty
            // Use subtotal to avoid double-applying discounts if the amount was already reduced
            $subtotal = (float) ($request->input('subtotal') ?? $validated['amount'] ?? 0);

            if (! $isLoyaltyRedemption) {
                // Get items for the discount calculation to ensure specific service logic is applied
                $items = $serviceOrder->details->map(function ($detail) {
                    return [
                        'service_id' => $detail->serviceVariant->service_id,
                        'price' => (float) $detail->serviceVariant->price,
                    ];
                })->toArray();

                $bestDiscount = Discount::getBestActiveDiscount($subtotal, $items);
                if ($bestDiscount) {
                    $reduction = $bestDiscount->calculateReduction($subtotal, $items);
                    $finalAmount = (float) round(max(0, $subtotal - $reduction));
                } else {
                    $finalAmount = $subtotal;
                }
            } else {
                $finalAmount = 0.00;
            }

            $payment = DB::transaction(function () use ($finalAmount, $isLoyaltyRedemption, $screenshotPath, $serviceOrder, $validated) {
                if (DB::table('payments')->where('service_order_id', $validated['service_order_id'])->exists()) {
                    throw ValidationException::withMessages([
                        'service_order_id' => ['This service order has already been paid.'],
                    ]);
                }

                $this->deductServiceInventory((int) $validated['service_order_id']);

                // Create payment record
                $payment = $this->repo->create([
                    'service_order_id' => $validated['service_order_id'],
                    'payment_method' => $isLoyaltyRedemption ? 'loyalty' : ($validated['payment_method'] ?? 'cash'),
                    'amount' => $finalAmount,
                    'gcash_reference' => $validated['gcash_reference'] ?? null,
                    'gcash_screenshot' => $screenshotPath,
                    'is_point_redeemed' => $isLoyaltyRedemption,
                    'employee_id' => $validated['employee_id'] ?? $serviceOrder->employee_id,
                ]);

                // Update service order status to completed and update employee if changed
                $updateData = ['status' => 'completed'];
                $oldEmployeeId = $serviceOrder->employee_id;

                if (isset($validated['employee_id'])) {
                    $updateData['employee_id'] = $validated['employee_id'];
                }

                $this->serviceOrders->update($serviceOrder, $updateData);

                // Mark the new employee as available
                if (isset($validated['employee_id'])) {
                    $this->employees->updateAssignedStatus($validated['employee_id'], 'available');
                }

                // Mark the old employee as available if one was assigned
                if ($oldEmployeeId) {
                    $this->employees->updateAssignedStatus($oldEmployeeId, 'available');
                }

                // Update bay status back to available
                $this->bays->updateStatus($validated['bay_id'], 'available');

                // Update queue line status if exists
                QueueLine::where('service_order_id', $validated['service_order_id'])
                    ->where('status', 'waiting')
                    ->update(['status' => 'completed']);

                return $payment;
            });

            return response()->json([
                'message' => 'Payment processed successfully',
                'payment' => $payment,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Payment processing failed: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Failed to process payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function deductServiceInventory(int $serviceOrderId): void
    {
        $requirements = DB::table('service_order_details')
            ->join('service_retails', 'service_order_details.service_variant', '=', 'service_retails.service_variant_id')
            ->join('supplies', 'service_retails.supply_id', '=', 'supplies.supply_id')
            ->where('service_order_id', $serviceOrderId)
            ->select([
                'service_retails.supply_id',
                'supplies.supply_name',
                'supplies.unit',
                'supplies.base_unit',
                'supplies.conversion_factor',
                DB::raw('SUM(service_order_details.quantity * service_retails.quantity_needed) as required_base_quantity'),
                DB::raw('SUM(service_order_details.quantity * service_retails.quantity_needed) / COALESCE(NULLIF(supplies.conversion_factor, 0), 1) as required_stock_quantity'),
            ])
            ->groupBy('service_retails.supply_id', 'supplies.supply_name', 'supplies.unit', 'supplies.base_unit', 'supplies.conversion_factor')
            ->get();

        if ($requirements->isEmpty()) {
            return;
        }

        $requiredBySupply = $requirements->mapWithKeys(function ($requirement) {
            return [
                (int) $requirement->supply_id => [
                    'base_quantity' => (float) $requirement->required_base_quantity,
                    'stock_quantity' => (float) $requirement->required_stock_quantity,
                    'supply_name' => $requirement->supply_name,
                    'unit' => $requirement->unit,
                    'base_unit' => $requirement->base_unit,
                ],
            ];
        });

        $supplies = DB::table('supplies')
            ->whereIn('supply_id', $requiredBySupply->keys()->all())
            ->lockForUpdate()
            ->get()
            ->keyBy('supply_id');

        $insufficient = [];

        foreach ($requiredBySupply as $supplyId => $required) {
            $supply = $supplies->get($supplyId);
            $availableQuantity = (float) ($supply->quantity_stock ?? 0);
            $requiredStockQuantity = $required['stock_quantity'];

            if (! $supply || $availableQuantity < $requiredStockQuantity) {
                $insufficient[] = [
                    'supply_id' => $supplyId,
                    'supply_name' => $required['supply_name'] ?? 'Unknown supply',
                    'available' => round($availableQuantity, 2),
                    'required_stock' => round($requiredStockQuantity, 2),
                    'required_base' => round($required['base_quantity'], 2),
                    'unit' => $required['unit'] ?? 'units',
                    'base_unit' => $required['base_unit'] ?? 'base units',
                ];
            }
        }

        if ($insufficient !== []) {
            $messages = collect($insufficient)
                ->map(fn (array $item): string => "{$item['supply_name']} requires {$item['required_base']} {$item['base_unit']} ({$item['required_stock']} {$item['unit']}), but only {$item['available']} {$item['unit']} is available.")
                ->all();

            throw ValidationException::withMessages([
                'inventory' => $messages,
            ]);
        }

        foreach ($requiredBySupply as $supplyId => $required) {
            DB::table('supplies')
                ->where('supply_id', $supplyId)
                ->decrement('quantity_stock', $required['stock_quantity']);
        }
    }

    /**
     * Get transactions list by date range.
     */
    public function getTransactions(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        $search = $request->query('search');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Check permission if requesting all data (export)
        if (! $request->has('per_page')) {
            if (! $request->user() || ! $request->user()->hasPermission('export_transactions_pdf')) {
                abort(403, 'Unauthorized action.');
            }
        }

        if ($request->has('per_page') || $search) {
            return response()->json($this->repo->getPaginatedTransactions($perPage, $search, $startDate, $endDate));
        }

        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $transactions = $this->repo->getTransactionsByDateRange(
            $request->start_date,
            $request->end_date
        );

        return response()->json($transactions);
    }
}
