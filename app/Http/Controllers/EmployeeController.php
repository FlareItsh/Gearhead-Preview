<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ServiceOrder;
use App\Models\StaffPayout;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    protected EmployeeRepositoryInterface $employees;

    public function __construct(EmployeeRepositoryInterface $employees)
    {
        $this->employees = $employees;
    }

    /**
     * List employees (render Inertia view)
     */
    public function index()
    {
        $employees = $this->employees->all()->map(function ($e) {
            return [
                'id' => $e->employee_id,
                'firstName' => $e->first_name,
                'middleName' => $e->middle_name,
                'lastName' => $e->last_name,
                'phone' => $e->phone_number,
                'address' => $e->address,
                'status' => ucfirst($e->status),
                'dateHired' => optional($e->date_hired)->format('Y-m-d'),
                'role' => 'Employee',
            ];
        });

        return Inertia::render('Admin/Staffs', [
            'staffs' => $employees,
        ]);
    }

    /**
     * Add a new employee
     */
    public function store(Request $request)
    {
        $request->validate([
            'firstName' => 'required|string',
            'middleName' => 'nullable|string',
            'lastName' => 'required|string',
            'phone' => 'required|string',
            'address' => 'required|string',
            'commissionPercentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $employee = $this->employees->create([
            'first_name' => $request->firstName,
            'middle_name' => $request->middleName,
            'last_name' => $request->lastName,
            'phone_number' => $request->phone,
            'address' => $request->address,
            'status' => 'active',
            'commission_percentage' => $request->commissionPercentage ?? 0,
            'date_hired' => now(),
        ]);

        return response()->json([
            'message' => 'Employee added successfully',
            'employee' => [
                'id' => $employee->employee_id,
                'firstName' => $employee->first_name,
                'middleName' => $employee->middle_name,
                'lastName' => $employee->last_name,
                'phone' => $employee->phone_number,
                'address' => $employee->address,
                'status' => ucfirst($employee->status),
                'dateHired' => $employee->date_hired->format('Y-m-d'),
                'role' => 'Employee',
            ],
        ]);
    }

    /**
     * Update an existing employee
     */
    public function update(Request $request, int $id)
    {
        $request->validate([
            'firstName' => 'required|string',
            'middleName' => 'nullable|string',
            'lastName' => 'required|string',
            'phone' => 'required|string',
            'address' => 'required|string',
            'status' => 'required|in:Active,Inactive,Absent',
            'commissionPercentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $currentEmployee = $this->employees->find($id);

        if ($currentEmployee->assigned_status === 'assigned' && strtolower($request->status) !== strtolower($currentEmployee->status)) {
            return response()->json([
                'message' => 'Status cannot be changed while assigned to a service.',
                'errors' => ['status' => ['This employee is currently assigned and their status cannot be modified.']],
            ], 422);
        }

        $employee = $this->employees->update($id, [
            'first_name' => $request->firstName,
            'middle_name' => $request->middleName,
            'last_name' => $request->lastName,
            'phone_number' => $request->phone,
            'address' => $request->address,
            'status' => strtolower($request->status),
            'commission_percentage' => $request->commissionPercentage ?? 0,
        ]);

        return response()->json([
            'message' => 'Employee updated successfully',
            'employee' => [
                'id' => $employee->employee_id,
                'firstName' => $employee->first_name,
                'middleName' => $employee->middle_name,
                'lastName' => $employee->last_name,
                'phone' => $employee->phone_number,
                'address' => $employee->address,
                'status' => ucfirst($employee->status),
                'dateHired' => $employee->date_hired->format('Y-m-d'),
                'role' => 'Employee',
            ],
        ]);
    }

    /**
     * Delete an employee
     */
    public function destroy(int $id)
    {
        $this->employees->delete($id);

        return response()->json([
            'message' => 'Employee deleted successfully',
        ]);
    }

    /**
     * Get the number of active employees.
     */
    public function activeCount()
    {
        $count = $this->employees->countActiveEmployees();

        return response()->json([
            'active_employees' => $count,
        ]);
    }

    /**
     * Get all active employees
     */
    public function activeAvailable()
    {
        $employees = $this->employees->findActive();

        return response()->json($employees->map(function ($employee) {
            return [
                'employee_id' => $employee->employee_id,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'email' => $employee->email,
                'phone_number' => $employee->phone_number,
                'status' => $employee->status,
            ];
        })->toArray());
    }

    public function getEmployees(Request $request)
    {
        $perPage = (int) $request->query('per_page', 10);
        $search = $request->query('search');
        $status = $request->query('status');

        if ($request->has('per_page') || $search || $status) {
            return response()->json($this->employees->getPaginatedEmployees($perPage, $search, $status));
        }

        return response()->json($this->employees->all());
    }

    /**
     * Get commissions for an employee
     */
    public function commissions(Request $request, int $id): JsonResponse
    {
        $employee = $this->employees->find($id);
        $completedOrders = $this->commissionOrders($employee, $request->query('start_date'), $request->query('end_date'));

        return response()->json([
            'employee' => $employee->full_name,
            'commission_percentage' => (float) $employee->commission_percentage,
            'orders' => $completedOrders,
            'total_commission' => (float) $completedOrders->sum('commission_amount'),
        ]);
    }

    /**
     * Get wallet details for an employee
     */
    public function wallet(int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $wallet = $this->walletSummary($employee);

        return response()->json([
            'employee' => $employee->full_name,
            ...$wallet,
        ]);
    }

    public function financialLedger(Request $request, int $id): JsonResponse
    {
        $employee = Employee::findOrFail($id);
        $orders = $this->commissionOrders($employee, $request->query('start_date'), $request->query('end_date'));

        return response()->json([
            'employee' => $employee->full_name,
            'commission_percentage' => (float) $employee->commission_percentage,
            ...$this->walletSummary($employee),
            'orders' => $orders,
            'total_commission' => (float) $orders->sum('commission_amount'),
        ]);
    }

    /**
     * Record a payout for an employee
     */
    public function payout(Request $request, int $id): JsonResponse
    {
        if (! $request->user()?->hasPermission('manage_payouts')) {
            abort(403);
        }

        $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payout_date' => 'required|date',
            'remarks' => 'nullable|string|max:255',
        ]);

        $employee = Employee::findOrFail($id);
        $balance = $this->remainingBalance($employee);

        if ((float) $request->amount > $balance) {
            throw ValidationException::withMessages([
                'amount' => ['Payout amount exceeds the employee remaining balance.'],
            ]);
        }

        $payout = StaffPayout::create([
            'employee_id' => $id,
            'amount' => $request->amount,
            'payout_date' => $request->payout_date,
            'remarks' => $request->remarks,
            'processed_by' => auth()->id(),
        ]);

        return response()->json([
            'message' => 'Payout recorded successfully',
            'payout' => $payout,
        ]);
    }

    public function batchPayout(Request $request): JsonResponse
    {
        if (! $request->user()?->hasPermission('manage_payouts')) {
            abort(403);
        }

        $validated = $request->validate([
            'payout_date' => 'required|date',
            'remarks' => 'nullable|string|max:255',
            'payouts' => 'required|array|min:1',
            'payouts.*.employee_id' => 'required|integer|exists:employees,employee_id',
            'payouts.*.amount' => 'required|numeric|min:0.01',
        ]);

        $createdPayouts = DB::transaction(function () use ($validated, $request) {
            return collect($validated['payouts'])->map(function (array $payout) use ($validated, $request) {
                $employee = Employee::findOrFail($payout['employee_id']);
                $balance = $this->remainingBalance($employee);

                if ((float) $payout['amount'] > $balance) {
                    throw ValidationException::withMessages([
                        'payouts' => ["{$employee->full_name}'s payout exceeds their remaining balance."],
                    ]);
                }

                return StaffPayout::create([
                    'employee_id' => $employee->employee_id,
                    'amount' => $payout['amount'],
                    'payout_date' => $validated['payout_date'],
                    'remarks' => $validated['remarks'] ?? null,
                    'processed_by' => $request->user()->user_id,
                ]);
            });
        });

        return response()->json([
            'message' => 'Batch payout recorded successfully',
            'payouts' => $createdPayouts,
        ]);
    }

    private function commissionOrders(Employee $employee, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $query = ServiceOrder::where('employee_id', $employee->employee_id)
            ->where('status', 'completed')
            ->with(['details.serviceVariant.service', 'user'])
            ->orderByDesc('order_date');

        if ($startDate && $endDate) {
            $query->whereBetween('order_date', [$startDate.' 00:00:00', $endDate.' 23:59:59']);
        }

        return $query->get()->map(function (ServiceOrder $order) use ($employee) {
            $subtotal = $this->orderSubtotal($order);

            return [
                'id' => $order->service_order_id,
                'date' => $order->order_date->format('Y-m-d H:i'),
                'customer' => $order->user ? $order->user->full_name : 'Walk-in',
                'services' => $order->details->map(function ($detail) {
                    return $detail->serviceVariant && $detail->serviceVariant->service
                        ? $detail->serviceVariant->service->service_name
                        : 'Unknown Service';
                })->join(', '),
                'total_amount' => $subtotal,
                'commission_amount' => $subtotal * ((float) $employee->commission_percentage / 100),
            ];
        });
    }

    /**
     * @return array{total_earned: float, total_paid: float, balance: float, payouts: mixed}
     */
    private function walletSummary(Employee $employee): array
    {
        $totalCommission = $this->lifetimeCommission($employee);
        $totalPayouts = (float) StaffPayout::where('employee_id', $employee->employee_id)->sum('amount');

        return [
            'total_earned' => (float) $totalCommission,
            'total_paid' => (float) $totalPayouts,
            'balance' => (float) ($totalCommission - $totalPayouts),
            'payouts' => StaffPayout::where('employee_id', $employee->employee_id)
                ->with('processor:user_id,first_name,last_name')
                ->orderByDesc('payout_date')
                ->orderByDesc('created_at')
                ->get(),
        ];
    }

    private function lifetimeCommission(Employee $employee): float
    {
        return (float) ServiceOrder::where('employee_id', $employee->employee_id)
            ->where('status', 'completed')
            ->with('details.serviceVariant')
            ->get()
            ->sum(fn (ServiceOrder $order) => $this->orderSubtotal($order) * ((float) $employee->commission_percentage / 100));
    }

    private function remainingBalance(Employee $employee): float
    {
        return $this->lifetimeCommission($employee) - (float) StaffPayout::where('employee_id', $employee->employee_id)->sum('amount');
    }

    private function orderSubtotal(ServiceOrder $order): float
    {
        return (float) $order->details->sum(function ($detail) {
            $price = $detail->serviceVariant ? (float) $detail->serviceVariant->price : 0;

            return (float) ($detail->quantity ?? 1) * $price;
        });
    }
}
