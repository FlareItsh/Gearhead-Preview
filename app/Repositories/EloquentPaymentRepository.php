<?php

namespace App\Repositories;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentPaymentRepository implements PaymentRepositoryInterface
{
    public function all(): Collection
    {
        return Payment::all();
    }

    public function findById(int $id): ?Payment
    {
        return Payment::find($id);
    }

    public function create(array $data): Payment
    {
        return Payment::create($data);
    }

    public function update(Payment $payment, array $data): bool
    {
        return $payment->update($data);
    }

    public function delete(Payment $payment): bool
    {
        return $payment->delete();
    }

    public function countByUserId(int $userId): int
    {
        return Payment::join('service_orders', 'payments.service_order_id', '=', 'service_orders.service_order_id')
            ->where('service_orders.user_id', $userId)
            ->count();
    }

    public function totalSpent(int $userId): int
    {
        return (int) Payment::join('service_orders', 'payments.service_order_id', '=', 'service_orders.service_order_id')
            ->where('service_orders.user_id', $userId)
            ->sum('payments.amount');
    }

    /**
     * Get all payments for a specific user, including services.
     */
    public function getPaymentsForUser(int $userId)
    {
        $isPgsql = DB::getDriverName() === 'pgsql';
        $groupConcat = $isPgsql ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')';

        return DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->join('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->where('so.user_id', $userId)
            ->select(
                'p.payment_id',
                'so.order_date as date',
                DB::raw($groupConcat.' as services'),
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.created_at',
                'p.updated_at'
            )
            ->groupBy(
                'p.payment_id',
                'so.order_date',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.created_at',
                'p.updated_at'
            )
            ->orderByDesc('p.created_at')
            ->get();
    }

    /**
     * Get paginated payments for a specific user.
     */
    public function getPaginatedPaymentsForUser(int $userId, int $perPage)
    {
        $isPgsql = DB::getDriverName() === 'pgsql';
        $groupConcat = $isPgsql ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')';
        $coalesceGroupConcat = $isPgsql ? "COALESCE($groupConcat, 'Unknown Service')" : "COALESCE($groupConcat, 'Unknown Service')";

        return DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->leftJoin('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->leftJoin('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->leftJoin('services as s', 'sv.service_id', '=', 's.service_id')
            ->where('so.user_id', $userId)
            ->select(
                'p.payment_id',
                'so.order_date as date',
                DB::raw($coalesceGroupConcat.' as services'),
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.created_at',
                'p.updated_at'
            )
            ->groupBy(
                'p.payment_id',
                'so.order_date',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.created_at',
                'p.updated_at'
            )
            ->orderByDesc('p.created_at')
            ->paginate($perPage);
    }

    /**
     * Dashboard Stats with optional date range
     */
    public function getSummaryByDateRange(string $startDate, string $endDate): array
    {
        // 1. Revenue & Payment Counts
        $paymentStats = DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->whereBetween('so.order_date', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->selectRaw('
                COALESCE(SUM(p.amount), 0) as total_amount, 
                COUNT(p.payment_id) as total_payments,
                SUM(CASE WHEN p.payment_method = \'cash\' THEN 1 ELSE 0 END) as cash_transactions,
                SUM(CASE WHEN p.payment_method = \'gcash\' THEN 1 ELSE 0 END) as gcash_transactions
            ')
            ->first();

        // 2. Expenses (Supply Purchases)
        // Using supply_purchase_details to be consistent with financial summary
        $expenseStats = DB::table('supply_purchase_details')
            ->whereBetween('purchase_date', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->selectRaw('
                COALESCE(SUM(quantity * unit_price), 0) as total_expenses,
                COUNT(DISTINCT supply_purchase_id) as total_expenses_count
            ')
            ->first();

        $totalRevenue = $paymentStats->total_amount ?? 0;
        $totalExpenses = $expenseStats->total_expenses ?? 0;

        return [
            'total_amount' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'profit' => $totalRevenue - $totalExpenses,
            'total_payments' => $paymentStats->total_payments ?? 0,
            'cash_transactions' => $paymentStats->cash_transactions ?? 0,
            'gcash_transactions' => $paymentStats->gcash_transactions ?? 0,
            'total_expenses_count' => $expenseStats->total_expenses_count ?? 0,
        ];
    }

    /**
     * Get monthly revenue for a specific year
     */
    public function getMonthlyRevenueByYear(int $year): array
    {
        $months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];

        $isPgsql = DB::getDriverName() === 'pgsql';
        $monthFunc = $isPgsql ? 'EXTRACT(MONTH FROM created_at)' : 'MONTH(created_at)';

        $data = DB::table('payments')
            ->selectRaw($monthFunc.' as month, COALESCE(SUM(amount), 0) as revenue')
            ->whereYear('created_at', $year)
            ->groupByRaw($monthFunc)
            ->orderByRaw($monthFunc)
            ->pluck('revenue', 'month');

        $result = [];
        for ($i = 1; $i <= 12; $i++) {
            $result[] = [
                'month' => $months[$i - 1],
                'revenue' => $data[$i] ?? 0,
            ];
        }

        return $result;
    }

    /**
     * Get financial summary (revenue, expenses, profit) by date range
     */
    public function getFinancialSummaryByDateRange(string $startDate, string $endDate): array
    {
        // Get revenue per day from payments (aligned with order date)
        $revenueData = DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->selectRaw((DB::getDriverName() === 'pgsql' ? 'CAST(so.order_date AS DATE)' : 'DATE(so.order_date)').' as date, COALESCE(SUM(p.amount), 0) as revenue')
            ->whereBetween('so.order_date', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->groupByRaw(DB::getDriverName() === 'pgsql' ? 'CAST(so.order_date AS DATE)' : 'DATE(so.order_date)')
            ->pluck('revenue', 'date');

        // Get expenses per day from supply purchases
        $expensesData = DB::table('supply_purchase_details')
            ->selectRaw((DB::getDriverName() === 'pgsql' ? 'CAST(purchase_date AS DATE)' : 'DATE(purchase_date)').' as date, COALESCE(SUM(quantity * unit_price), 0) as expenses')
            ->whereBetween('purchase_date', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->groupByRaw(DB::getDriverName() === 'pgsql' ? 'CAST(purchase_date AS DATE)' : 'DATE(purchase_date)')
            ->pluck('expenses', 'date');

        // Generate date range and merge data
        $period = new \DatePeriod(
            new \DateTime($startDate),
            new \DateInterval('P1D'),
            (new \DateTime($endDate))->modify('+1 day')
        );

        $financialData = [];
        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $rev = (float) ($revenueData[$dateStr] ?? 0);
            $exp = (float) ($expensesData[$dateStr] ?? 0);
            $financialData[] = [
                'date' => $dateStr,
                'revenue' => $rev,
                'expenses' => $exp,
                'profit' => $rev - $exp,
            ];
        }

        return $financialData;
    }

    /**
     * Get average booking value by date range
     */
    public function getAverageBookingValueByDateRange(string $startDate, string $endDate): float
    {
        $result = DB::table('payments')
            ->selectRaw('AVG(amount) as avg_value')
            ->whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->value('avg_value');

        return (float) ($result ?? 0);
    }

    /**
     * Get customer retention rate by date range
     * Retention rate = (customers with repeat bookings) / (total unique customers) * 100
     */
    public function getCustomerRetentionRateByDateRange(string $startDate, string $endDate): float
    {
        $dateRange = [$startDate.' 00:00:00', $endDate.' 23:59:59'];

        // Get count of all unique customers and repeat customers in a single query
        $stats = DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->whereBetween('p.created_at', $dateRange)
            ->selectRaw('COUNT(DISTINCT so.user_id) as total_customers')
            ->selectRaw('COUNT(DISTINCT CASE WHEN booking_counts.cnt > 1 THEN so.user_id END) as repeat_customers')
            ->joinSub(
                DB::table('payments as p2')
                    ->join('service_orders as so2', 'p2.service_order_id', '=', 'so2.service_order_id')
                    ->whereBetween('p2.created_at', $dateRange)
                    ->selectRaw('so2.user_id, COUNT(*) as cnt')
                    ->groupBy('so2.user_id'),
                'booking_counts',
                'so.user_id',
                '=',
                'booking_counts.user_id'
            )
            ->first();

        if (! $stats || $stats->total_customers == 0) {
            return 0;
        }

        return (float) (($stats->repeat_customers / $stats->total_customers) * 100);
    }

    public function getAllTransactions()
    {
        return DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->join('users as u', 'so.user_id', '=', 'u.user_id')
            ->leftJoin('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->leftJoin('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->leftJoin('services as s', 'sv.service_id', '=', 's.service_id')
            ->leftJoin('employees as e', 'p.employee_id', '=', 'e.employee_id')
            ->select(
                'p.payment_id',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.gcash_screenshot',
                'p.is_point_redeemed',
                'p.created_at as payment_date',
                'so.order_date',
                'so.status',
                'u.first_name',
                'u.last_name',
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')').' as services'),
                DB::raw("CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')) as employee_name")
            )
            ->groupBy(
                'p.payment_id',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.gcash_screenshot',
                'p.is_point_redeemed',
                'p.created_at',
                'so.order_date',
                'so.status',
                'u.first_name',
                'u.last_name',
                'e.first_name',
                'e.last_name'
            )
            ->orderBy('so.order_date', 'desc')
            ->get()
            ->map(function ($transaction) {
                return [
                    'payment_id' => $transaction->payment_id,
                    'date' => $transaction->order_date ?? date('Y-m-d', strtotime($transaction->payment_date)),
                    'customer' => $transaction->first_name.' '.$transaction->last_name,
                    'services' => $transaction->services ?? 'N/A',
                    'amount' => (float) $transaction->amount,
                    'payment_method' => ucfirst($transaction->payment_method),
                    'gcash_reference' => $transaction->gcash_reference,
                    'gcash_screenshot' => $transaction->gcash_screenshot,
                    'status' => $transaction->status,
                    'is_point_redeemed' => (bool) $transaction->is_point_redeemed,
                    'employee' => trim($transaction->employee_name) ?: 'Unassigned',
                ];
            });
    }

    public function getTransactionsByDateRange(string $startDate, string $endDate)
    {
        return DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->join('users as u', 'so.user_id', '=', 'u.user_id')
            ->leftJoin('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->leftJoin('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->leftJoin('services as s', 'sv.service_id', '=', 's.service_id')
            ->leftJoin('employees as e', 'p.employee_id', '=', 'e.employee_id')
            ->whereBetween('so.order_date', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->select(
                'p.payment_id',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.gcash_screenshot',
                'p.is_point_redeemed',
                'p.created_at as payment_date',
                'so.order_date',
                'so.status',
                'u.first_name',
                'u.last_name',
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')').' as services'),
                DB::raw("CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')) as employee_name")
            )
            ->groupBy(
                'p.payment_id',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.gcash_screenshot',
                'p.is_point_redeemed',
                'p.created_at',
                'so.order_date',
                'so.status',
                'u.first_name',
                'u.last_name',
                'e.first_name',
                'e.last_name'
            )
            ->orderBy('so.order_date', 'desc')
            ->get()
            ->map(function ($transaction) {
                return [
                    'payment_id' => $transaction->payment_id,
                    'date' => $transaction->order_date ?? date('Y-m-d', strtotime($transaction->payment_date)),
                    'customer' => $transaction->first_name.' '.$transaction->last_name,
                    'services' => $transaction->services ?? 'N/A',
                    'amount' => (float) $transaction->amount,
                    'payment_method' => ucfirst($transaction->payment_method),
                    'gcash_reference' => $transaction->gcash_reference,
                    'gcash_screenshot' => $transaction->gcash_screenshot,
                    'status' => $transaction->status,
                    'is_point_redeemed' => (bool) $transaction->is_point_redeemed,
                    'employee' => trim($transaction->employee_name) ?: 'Unassigned',
                ];
            });

    }

    public function getPaginatedTransactions(int $perPage, ?string $search = null, ?string $startDate = null, ?string $endDate = null)
    {
        $query = DB::table('payments as p')
            ->join('service_orders as so', 'p.service_order_id', '=', 'so.service_order_id')
            ->join('users as u', 'so.user_id', '=', 'u.user_id')
            ->leftJoin('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->leftJoin('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->leftJoin('services as s', 'sv.service_id', '=', 's.service_id')
            ->leftJoin('employees as e', 'p.employee_id', '=', 'e.employee_id')
            ->select(
                'p.payment_id',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.gcash_screenshot',
                'p.is_point_redeemed',
                'p.created_at as payment_date',
                'so.order_date',
                'so.status',
                'u.first_name',
                'u.last_name',
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')').' as services'),
                DB::raw("CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')) as employee_name")
            )
            ->groupBy(
                'p.payment_id',
                'p.amount',
                'p.payment_method',
                'p.gcash_reference',
                'p.gcash_screenshot',
                'p.is_point_redeemed',
                'p.created_at',
                'so.order_date',
                'so.status',
                'u.first_name',
                'u.last_name',
                'e.first_name',
                'e.last_name'
            );

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw("CONCAT(u.first_name, ' ', u.last_name)"), 'like', "%{$search}%")
                    ->orWhere('p.gcash_reference', 'like', "%{$search}%");
            });
        }

        if ($startDate && $endDate) {
            $query->whereBetween('so.order_date', [$startDate.' 00:00:00', $endDate.' 23:59:59']);
        }

        return $query->orderBy('so.order_date', 'desc')
            ->paginate($perPage)
            ->through(function ($transaction) {
                return [
                    'payment_id' => $transaction->payment_id,
                    'date' => $transaction->order_date ?? date('Y-m-d', strtotime($transaction->payment_date)),
                    'customer' => $transaction->first_name.' '.$transaction->last_name,
                    'services' => $transaction->services ?? 'N/A',
                    'amount' => (float) $transaction->amount,
                    'payment_method' => ucfirst($transaction->payment_method),
                    'gcash_reference' => $transaction->gcash_reference,
                    'gcash_screenshot' => $transaction->gcash_screenshot,
                    'status' => $transaction->status,
                    'is_point_redeemed' => (bool) $transaction->is_point_redeemed,
                    'employee' => trim($transaction->employee_name) ?: 'Unassigned',
                ];
            });
    }
}
