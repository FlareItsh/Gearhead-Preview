<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

class BookingRepository
{
    /**
     * Get all bookings for a user with services and payment info
     */
    public function getBookingsByUser(int $userId, ?string $status = null, int $perPage = 9)
    {
        $query = DB::table('service_orders')
            ->join('service_order_details', 'service_orders.service_order_id', '=', 'service_order_details.service_order_id')
            ->join('service_variants', 'service_order_details.service_variant', '=', 'service_variants.service_variant')
            ->join('services', 'service_variants.service_id', '=', 'services.service_id')
            ->leftJoin('payments', 'service_orders.service_order_id', '=', 'payments.service_order_id')
            ->where('service_orders.user_id', $userId)
            ->select(
                'service_orders.service_order_id',
                'service_orders.status as order_status',
                'service_orders.order_date',
                'service_orders.order_type',
                'service_orders.created_at',
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(services.service_name, \', \')' : 'GROUP_CONCAT(services.service_name SEPARATOR \', \')').' as services'),
                DB::raw('SUM(service_order_details.quantity * service_variants.price) as total_amount'),
                DB::raw('MAX(payments.payment_method) as payment_method')
            )
            ->groupBy(
                'service_orders.service_order_id',
                'service_orders.status',
                'service_orders.order_date',
                'service_orders.order_type',
                'service_orders.created_at'
            );

        if ($status && $status !== 'all') {
            $query->where('service_orders.status', $status);
        }

        // Order by status (pending first, in_progress second) then by most recent date
        return $query->orderByRaw(DB::getDriverName() === 'pgsql' ? "CASE WHEN service_orders.status = 'pending' THEN 1 WHEN service_orders.status = 'in_progress' THEN 2 WHEN service_orders.status = 'completed' THEN 3 WHEN service_orders.status = 'cancelled' THEN 4 ELSE 5 END ASC" : "FIELD(service_orders.status, 'pending', 'in_progress', 'completed', 'cancelled') ASC")
            ->orderByDesc('service_orders.order_date')
            ->paginate($perPage);
    }
}
