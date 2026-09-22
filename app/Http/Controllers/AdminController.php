<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\BayRepositoryInterface;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    private UserRepositoryInterface $users;

    private ServiceRepositoryInterface $services;

    private PaymentRepositoryInterface $payments;

    private BayRepositoryInterface $bays;

    private ServiceOrderRepositoryInterface $serviceOrders;

    private EmployeeRepositoryInterface $employees;

    public function __construct(
        UserRepositoryInterface $users,
        ServiceRepositoryInterface $services,
        PaymentRepositoryInterface $payments,
        BayRepositoryInterface $bays,
        ServiceOrderRepositoryInterface $serviceOrders,
        EmployeeRepositoryInterface $employees
    ) {
        $this->users = $users;
        $this->services = $services;
        $this->payments = $payments;
        $this->bays = $bays;
        $this->serviceOrders = $serviceOrders;
        $this->employees = $employees;
    }

    public function registry(Request $request)
    {
        return Inertia::render('Admin/Registry', [
            'users' => $this->users->all(),
            'initialBays' => $this->bays->all(),
            'initialActiveOrders' => $this->serviceOrders->getActiveOrders(),
            'initialEmployees' => $this->employees->findActive()->map(function ($employee) {
                return [
                    'employee_id' => $employee->employee_id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'email' => $employee->email,
                    'phone_number' => $employee->phone_number,
                    'status' => $employee->status,
                ];
            })->values(),
        ]);
    }

    public function bookings(Request $request)
    {
        return Inertia::render('Admin/Bookings', [
            'users' => $this->users->all(),
        ]);
    }

    public function customers(Request $request)
    {
        return Inertia::render('Admin/Customers', [
            'users' => $this->users->all(),
        ]);
    }

    public function services(Request $request)
    {
        // Get all services including inactive ones (for admin management)
        $services = $this->services->allIncludingInactive();

        // Distinct categories (all services including inactive)
        $categories = $this->services->getDistinctCategories();

        // Selected category from query string
        $selectedCategory = $request->query('category', 'All');

        return Inertia::render('Admin/Services', [
            'services' => $services,
            'categories' => $categories,
            'selectedCategory' => $selectedCategory,
        ]);
    }

    public function staffs(Request $request)
    {
        return Inertia::render('Admin/Staffs', [
            'users' => $this->users->all(),
        ]);
    }

    public function inventory(Request $request)
    {
        return Inertia::render('Admin/Inventory', [
            'users' => $this->users->all(),
        ]);
    }

    public function transactions(Request $request)
    {
        // Get all transactions with joined details
        $transactions = $this->payments->getAllTransactions();

        // Dashboard statistics
        $stats = [
            'total_revenue' => $transactions->sum('amount'),
            'total_transactions' => $transactions->count(),
            'cash_transactions' => $transactions->where('payment_method', 'Cash')->count(),
            'gcash_transactions' => $transactions->where('payment_method', 'Gcash')->count(),
            'points_redeemed_count' => $transactions->where('is_point_redeemed', true)->count(),
        ];

        return Inertia::render('Admin/Transactions', [
            'transactions' => $transactions,
            'stats' => $stats,
        ]);
    }

    public function reports(Request $request)
    {
        return Inertia::render('Admin/Reports', [
            'users' => $this->users->all(),
        ]);
    }

    public function bays(Request $request)
    {
        return Inertia::render('Admin/Bays', [
            'users' => $this->users->all(),
        ]);
    }

    public function dashboard(Request $request, CustomerController $customer)
    {
        $user = $request->user();
        if ($user && method_exists($user, 'hasRole') && $user->hasRole('customer')) {
            return $customer->dashboard($request);
        }

        // Fetch low stock supplies
        // Logic: quantity_stock <= reorder_point (fallback to 10 if null, though usually handled via valid reorder points)
        $lowStockSupplies = \App\Models\Supply::query()
            ->whereColumn('quantity_stock', '<=', 'reorder_point')
            ->orWhere(function ($query) {
                $query->whereNull('reorder_point')->where('quantity_stock', '<=', 10);
            })
            ->orderBy('quantity_stock', 'asc')
            ->take(5)
            ->get();

        return Inertia::render('dashboard', [
            'lowStockSupplies' => $lowStockSupplies,
        ]);
    }
}
