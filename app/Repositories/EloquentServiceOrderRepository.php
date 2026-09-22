<?php

namespace App\Repositories;

use App\Models\ServiceOrder;
use App\Repositories\Contracts\ServiceOrderRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentServiceOrderRepository implements ServiceOrderRepositoryInterface
{
    public function all(): Collection
    {
        return ServiceOrder::all();
    }

    public function findById(int $id): ?ServiceOrder
    {
        return ServiceOrder::find($id);
    }

    public function findByUserAndDate(int $userId, string $orderDate): ?ServiceOrder
    {
        return ServiceOrder::where('user_id', $userId)
            ->where('order_date', $orderDate)
            ->with('details')
            ->first();
    }

    public function create(array $data): ServiceOrder
    {
        return ServiceOrder::create($data);
    }

    /**
     * Create a service order with details inside a DB transaction.
     */
    public function createWithDetails(array $orderData, array $details): ServiceOrder
    {
        return DB::transaction(function () use ($orderData, $details) {
            $order = ServiceOrder::create($orderData);

            // Ensure details are mapped to expected fields (service_variant, quantity)
            $mapped = array_map(function ($d) {
                return [
                    'service_variant' => $d['service_variant'] ?? null,
                    'quantity' => $d['quantity'] ?? 1,
                ];
            }, $details);

            // Create relation records
            $order->details()->createMany($mapped);

            return $order->fresh('details');
        });
    }

    public function update(ServiceOrder $order, array $data): bool
    {
        return $order->update($data);
    }

    public function delete(ServiceOrder $order): bool
    {
        return $order->delete();
    }

    public function upcomingBookings(int $userId)
    {
        return DB::table('service_orders as so')
            ->leftJoin('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->leftJoin('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->leftJoin('services as s', 'sv.service_id', '=', 's.service_id')
            ->where('so.user_id', $userId)
            ->whereIn('so.status', ['pending', 'in_progress'])
            ->select(
                'so.service_order_id',
                'so.order_date',
                'so.order_type',
                'so.status',
                DB::raw((DB::getDriverName() === 'pgsql' ? 'COALESCE(STRING_AGG(s.service_name, \', \'), \'No services listed\')' : 'COALESCE(GROUP_CONCAT(s.service_name SEPARATOR \', \'), \'No services listed\')').' as service_names'),
                DB::raw('COALESCE(SUM(sv.price * sod.quantity), 0) as total_amount')
            )
            ->groupBy(
                'so.service_order_id',
                'so.order_date',
                'so.order_type',
                'so.status'
            )
            ->orderByRaw(DB::getDriverName() === 'pgsql' ? "CASE WHEN so.status = 'in_progress' THEN 1 WHEN so.status = 'pending' THEN 2 ELSE 3 END" : "FIELD(so.status, 'in_progress', 'pending')")
            ->orderByDesc('so.order_date')
            ->get();
    }

    /**
     * Get service orders with optional status filter.
     *
     * @param  string|null  $status  'pending', 'in_progress', 'completed', 'cancelled' or null for all
     * @return \Illuminate\Support\Collection
     */
    public function getOrdersWithStatus(?string $status = null)
    {
        $query = DB::table('service_orders as so')
            ->join('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->leftJoin('payments as p', 'so.service_order_id', '=', 'p.service_order_id')
            ->select(
                'so.service_order_id',
                'so.status',
                'so.order_date',
                'so.order_type',
                'so.user_id',
                'p.amount as payment_amount',
                'p.payment_method',
                'p.gcash_reference',
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(s.service_name, \', \')' : 'GROUP_CONCAT(s.service_name SEPARATOR \', \')').' as services')
            )
            ->groupBy('so.service_order_id', 'so.status', 'so.order_date', 'so.order_type', 'so.user_id', 'p.amount', 'p.payment_method', 'p.gcash_reference')
            ->orderByDesc('so.order_date');

        if ($status && $status !== 'all') {
            if ($status === 'upcoming') {
                $query->whereIn('so.status', ['pending', 'in_progress']);
            } else {
                $query->where('so.status', $status);
            }
        }

        return $query->get();
    }

    /**
     * {@inheritdoc}
     */
    public function getPendingOrders()
    {
        return DB::table('service_orders as so')
            ->join('users as u', 'u.user_id', '=', 'so.user_id')
            ->join('service_order_details as sod', 'sod.service_order_id', '=', 'so.service_order_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->whereIn('so.status', ['pending', 'in_progress'])
            ->whereDate('so.order_date', '>=', now('Asia/Manila')->toDateString())
            ->select(
                'so.service_order_id',
                DB::raw("CONCAT_WS(' ', u.first_name, NULLIF(u.middle_name, ''), u.last_name) as customer_name"),
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')').' as service_name'),
                'so.order_date',
                'so.status'
            )
            ->groupBy('so.service_order_id', 'so.order_date', 'so.status', 'u.first_name', 'u.middle_name', 'u.last_name')
            ->orderBy('so.order_date')
            ->get();
    }

    /**
     * {@inheritdoc}
     */
    public function getAllBookings(?string $startDate = null, ?string $endDate = null, ?string $sortBy = 'order_date', ?string $sortOrder = 'asc')
    {
        $query = DB::table('service_orders as so')
            ->join('users as u', 'u.user_id', '=', 'so.user_id')
            ->join('service_order_details as sod', 'sod.service_order_id', '=', 'so.service_order_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->select(
                'so.service_order_id',
                DB::raw("CONCAT_WS(' ', u.first_name, NULLIF(u.middle_name, ''), u.last_name) as customer_name"),
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')').' as service_names'),
                DB::raw('COALESCE(SUM(sv.price * sod.quantity), 0) as total_price'),
                'so.order_date',
                'so.status',
                'so.created_at'
            )
            ->groupBy('so.service_order_id', 'so.order_date', 'so.status', 'so.created_at', 'u.first_name', 'u.middle_name', 'u.last_name');

        if ($startDate) {
            $query->whereDate('so.order_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('so.order_date', '<=', $endDate);
        }

        return $query->orderByRaw(DB::getDriverName() === 'pgsql' ? "CASE WHEN so.status = 'pending' THEN 1 WHEN so.status = 'in_progress' THEN 2 WHEN so.status = 'completed' THEN 3 WHEN so.status = 'cancelled' THEN 4 ELSE 5 END" : "FIELD(so.status, 'pending', 'in_progress', 'completed', 'cancelled')")
            ->orderBy($sortBy === 'customer_name' ? 'u.last_name' : $sortBy, $sortOrder)
            ->get();
    }

    public function getPaginatedBookings(int $perPage, ?string $search = null, ?string $startDate = null, ?string $endDate = null, ?string $status = null, ?string $sortBy = 'order_date', ?string $sortOrder = 'asc')
    {
        $query = DB::table('service_orders as so')
            ->join('users as u', 'u.user_id', '=', 'so.user_id')
            ->join('service_order_details as sod', 'sod.service_order_id', '=', 'so.service_order_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->select(
                'so.service_order_id',
                DB::raw("CONCAT_WS(' ', u.first_name, NULLIF(u.middle_name, ''), u.last_name) as customer_name"),
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(DISTINCT s.service_name, \', \')' : 'GROUP_CONCAT(DISTINCT s.service_name SEPARATOR \', \')').' as service_names'),
                DB::raw('COALESCE(SUM(sv.price * sod.quantity), 0) as total_price'),
                'so.order_date',
                'so.status',
                'so.created_at'
            )
            ->groupBy('so.service_order_id', 'so.order_date', 'so.status', 'so.created_at', 'u.first_name', 'u.middle_name', 'u.last_name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw("CONCAT_WS(' ', u.first_name, NULLIF(u.middle_name, ''), u.last_name)"), 'like', "%{$search}%")
                    ->orWhere('so.service_order_id', 'like', "%{$search}%");
            });
        }

        if ($startDate) {
            $query->whereDate('so.order_date', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('so.order_date', '<=', $endDate);
        }
        if ($status && $status !== 'all') {
            $query->where('so.status', $status);
        }

        return $query->orderByRaw(DB::getDriverName() === 'pgsql' ? "CASE WHEN so.status = 'pending' THEN 1 WHEN so.status = 'in_progress' THEN 2 WHEN so.status = 'completed' THEN 3 WHEN so.status = 'cancelled' THEN 4 ELSE 5 END" : "FIELD(so.status, 'pending', 'in_progress', 'completed', 'cancelled')")
            ->orderBy($sortBy === 'customer_name' ? 'u.last_name' : $sortBy, $sortOrder)
            ->paginate($perPage);
    }

    public function deleteServiceOrderDetails(int $serviceOrderId): bool
    {
        return DB::table('service_order_details')
            ->where('service_order_id', $serviceOrderId)
            ->delete() >= 0;
    }

    public function replaceServiceOrderDetails(int $serviceOrderId, array $serviceIds): void
    {
        DB::transaction(function () use ($serviceOrderId, $serviceIds) {
            $this->deleteServiceOrderDetails($serviceOrderId);

            foreach ($serviceIds as $serviceId) {
                // Find a default variant for this service (e.g., the first one)
                $variant = DB::table('service_variants')
                    ->where('service_id', $serviceId)
                    ->first();

                if ($variant) {
                    DB::table('service_order_details')->insert([
                        'service_order_id' => $serviceOrderId,
                        'service_variant' => $variant->service_variant,
                        'quantity' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        });
    }

    public function replaceServiceOrderDetailsWithVariants(int $serviceOrderId, array $variantIds): void
    {
        DB::transaction(function () use ($serviceOrderId, $variantIds) {
            $this->deleteServiceOrderDetails($serviceOrderId);

            // Filter out unique variants to avoid constraint violations
            $uniqueVariants = array_unique($variantIds, SORT_REGULAR);

            foreach ($uniqueVariants as $variantId) {
                // Handle case where $variantId is an object (common with Inertia/Eloquent responses)
                if (is_object($variantId) && isset($variantId->service_variant)) {
                    $variantId = $variantId->service_variant;
                } elseif (is_array($variantId) && isset($variantId['service_variant'])) {
                    $variantId = $variantId['service_variant'];
                }

                // Skip if still not a valid ID
                if (! is_numeric($variantId)) {
                    \Log::warning('Invalid variant_id skipped in replaceServiceOrderDetailsWithVariants', [
                        'service_order_id' => $serviceOrderId,
                        'variant_id' => $variantId,
                    ]);

                    continue;
                }

                DB::table('service_order_details')->insert([
                    'service_order_id' => $serviceOrderId,
                    'service_variant' => (int) $variantId,
                    'quantity' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });
    }

    public function getTodayBookings()
    {
        $today = now('Asia/Manila')->format('Y-m-d');

        return DB::table('service_orders as so')
            ->join('users as u', 'so.user_id', '=', 'u.user_id')
            ->join('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->leftJoin('queue_lines as ql', function ($join) {
                $join->on('so.service_order_id', '=', 'ql.service_order_id')
                    ->where('ql.status', '=', 'waiting');
            })
            ->where('so.status', 'pending')
            ->whereDate('so.order_date', $today)
            ->where(function ($query) {
                $query->where('so.order_type', 'R')
                    ->orWhereNotNull('ql.queue_line_id');
            })
            ->select(
                'so.service_order_id',
                'so.user_id',
                'so.order_date',
                'u.first_name',
                'u.last_name',
                'u.phone_number as phone',
                'ql.created_at as queue_created_at',
                'ql.queue_line_id',
                DB::raw('(SELECT COUNT(*) + 1 FROM queue_lines ql2 WHERE ql2.status = \'waiting\' AND ql2.created_at < ql.created_at) as queue_number'),
                DB::raw("CONCAT(u.first_name, ' ', u.last_name) as customer_name"),
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(s.service_name, \', \')' : 'GROUP_CONCAT(s.service_name SEPARATOR \', \')').' as services'),
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(CAST(s.service_id as TEXT), \',\')' : 'GROUP_CONCAT(s.service_id)').' as service_ids'),
                DB::raw((DB::getDriverName() === 'pgsql' ? 'STRING_AGG(CAST(sv.service_variant as TEXT), \',\')' : 'GROUP_CONCAT(sv.service_variant)').' as variant_ids'),
                DB::raw('COALESCE(SUM(sv.price * sod.quantity), 0) as total')
            )
            ->groupBy('so.service_order_id', 'so.user_id', 'so.order_date', 'u.first_name', 'u.last_name', 'u.phone_number', 'ql.created_at', 'ql.queue_line_id')
            ->orderByRaw('CASE WHEN ql.queue_line_id IS NOT NULL THEN 0 ELSE 1 END')
            ->orderBy('ql.created_at', 'asc')
            ->orderBy('so.order_date', 'asc')
            ->get()
            ->map(function ($booking) {
                return [
                    'service_order_id' => $booking->service_order_id,
                    'user_id' => $booking->user_id,
                    'customer_name' => $booking->customer_name,
                    'first_name' => $booking->first_name,
                    'last_name' => $booking->last_name,
                    'phone' => $booking->phone,
                    'services' => $booking->services,
                    'service_ids' => $booking->service_ids ? explode(',', $booking->service_ids) : [],
                    'variant_ids' => $booking->variant_ids ? explode(',', $booking->variant_ids) : [],
                    'total' => $booking->total,
                    'order_date' => $booking->order_date,
                    'is_queued' => ! is_null($booking->queue_line_id),
                    'queue_number' => $booking->queue_number,
                ];
            });
    }

    public function cancelBooking(int $serviceOrderId): bool
    {
        return DB::transaction(function () use ($serviceOrderId) {
            $updated = DB::table('service_orders')
                ->where('service_order_id', $serviceOrderId)
                ->update(['status' => 'cancelled', 'updated_at' => now()]) > 0;

            if ($updated) {
                DB::table('queue_lines')
                    ->where('service_order_id', $serviceOrderId)
                    ->where('status', 'waiting')
                    ->update(['status' => 'cancelled', 'updated_at' => now()]);
            }

            return $updated;
        });
    }

    public function countCompletedBookingsForUser(int $userId): int
    {
        return ServiceOrder::where('user_id', $userId)
            ->whereHas('payments')
            ->count();
    }

    public function getActiveOrders()
    {
        return ServiceOrder::where(function ($query) {
            $query->where('status', 'in_progress')
                ->orWhere(function ($q) {
                    $q->where('status', 'pending')
                        ->whereDate('order_date', now('Asia/Manila')->toDateString());
                });
        })
            ->with([
                'user:user_id,first_name,last_name,email,phone_number',
                'details',
                'details.serviceVariant',
                'details.serviceVariant.service',
                'bay:bay_id,bay_number,status',
                'employee:employee_id,first_name,last_name,phone_number,status,assigned_status',
            ])
            ->orderByDesc('order_date')
            ->get()
            ->unique('bay_id')
            ->values();
    }
}
