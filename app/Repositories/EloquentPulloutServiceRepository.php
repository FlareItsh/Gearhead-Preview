<?php

namespace App\Repositories;

use App\Models\PulloutService;
use App\Repositories\Contracts\PulloutServiceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentPulloutServiceRepository implements PulloutServiceRepositoryInterface
{
    public function all(): Collection
    {
        return PulloutService::all();
    }

    public function findById(int $id): ?PulloutService
    {
        return PulloutService::find($id);
    }

    public function create(array $data): PulloutService
    {
        return PulloutService::create($data);
    }

    public function update(PulloutService $service, array $data): bool
    {
        return $service->update($data);
    }

    public function delete(PulloutService $service): bool
    {
        return $service->delete();
    }

    public function getAllWithDetails()
    {
        return PulloutService::with([
            'serviceOrderDetail.service:service_id,service_name',
            'serviceOrderDetail.serviceOrder.user:user_id,first_name,last_name',
            'serviceOrderDetail.serviceOrder.employee:employee_id,first_name,last_name',
            'pulloutRequestDetails.supply:supply_id,supply_name,unit',
            'pulloutRequestDetails.pulloutRequest',
        ])
            ->orderByDesc('created_at')
            ->get();
    }

    public function getActiveServiceOrdersForPullout()
    {
        return DB::table('service_orders as so')
            ->join('service_order_details as sod', 'so.service_order_id', '=', 'sod.service_order_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('employees as e', 'so.employee_id', '=', 'e.employee_id')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->join('bays as b', 'so.bay_id', '=', 'b.bay_id')
            ->join('users as u', 'so.user_id', '=', 'u.user_id')
            ->whereIn('so.status', ['in_progress', 'pending'])
            ->whereNotNull('so.employee_id')
            ->select(
                'sod.service_order_detail_id',
                'so.service_order_id',
                'so.employee_id',
                DB::raw("CONCAT(e.first_name, ' ', e.last_name) as employee_name"),
                DB::raw("CONCAT(u.first_name, ' ', u.last_name) as customer_name"),
                's.service_name',
                'sv.size',
                'b.bay_number',
                'so.order_date'
            )
            ->orderBy('so.order_date')
            ->get();
    }
}
