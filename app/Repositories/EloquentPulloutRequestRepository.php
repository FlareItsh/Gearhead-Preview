<?php

namespace App\Repositories;

use App\Models\PulloutRequest;
use App\Models\PulloutRequestDetail;
use App\Models\PulloutService;
use App\Repositories\Contracts\PulloutRequestRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentPulloutRequestRepository implements PulloutRequestRepositoryInterface
{
    public function all(): Collection
    {
        return PulloutRequest::all();
    }

    public function findById(int $id): ?PulloutRequest
    {
        return PulloutRequest::find($id);
    }

    public function create(array $data): PulloutRequest
    {
        return PulloutRequest::create($data);
    }

    public function update(PulloutRequest $request, array $data): bool
    {
        return $request->update($data);
    }

    public function delete(PulloutRequest $request): bool
    {
        return $request->delete();
    }

    public function getAllWithDetails()
    {
        return DB::table('pullout_requests as pr')
            ->join('employees as e', 'pr.employee_id', '=', 'e.employee_id')
            ->join('pullout_request_details as prd', 'pr.pullout_request_id', '=', 'prd.pullout_request_id')
            ->join('pullout_services as ps', 'prd.pullout_service_id', '=', 'ps.pullout_service_id')
            ->join('service_order_details as sod', 'ps.service_order_detail_id', '=', 'sod.service_order_detail_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->join('service_orders as so', 'sod.service_order_id', '=', 'so.service_order_id')
            ->join('supplies as sup', 'prd.supply_id', '=', 'sup.supply_id')
            ->select(
                'pr.pullout_request_id',
                'pr.date_time as created_at',
                'pr.is_approve',
                'pr.approve_by',
                'pr.approve_date',
                'so.service_order_id',
                's.service_name',
                'sv.size',
                DB::raw("CONCAT(e.first_name, ' ', e.last_name) as employee_name"),
                DB::raw((DB::getDriverName() === 'pgsql' ? "STRING_AGG(CONCAT(sup.supply_name, ' (', prd.quantity, ' ', sup.unit, ')'), ', ')" : "GROUP_CONCAT(CONCAT(sup.supply_name, ' (', prd.quantity, ' ', sup.unit, ')') SEPARATOR ', ')").' as supplies')
            )
            ->groupBy(
                'pr.pullout_request_id',
                'pr.date_time',
                'pr.is_approve',
                'pr.approve_by',
                'pr.approve_date',
                'so.service_order_id',
                's.service_name',
                'e.first_name',
                'e.last_name',
                'sv.size'
            )
            ->orderByDesc('pr.date_time')
            ->get()
            ->map(function ($item) {
                $item->status = $item->is_approve ? 'approved' : 'pending';
                // Get individual supply details for this request
                $details = DB::table('pullout_request_details as prd')
                    ->join('supplies as sup', 'prd.supply_id', '=', 'sup.supply_id')
                    ->where('prd.pullout_request_id', $item->pullout_request_id)
                    ->select('sup.supply_name', 'prd.quantity', 'sup.unit', 'sup.supply_type')
                    ->get();
                $item->details = $details;

                return $item;
            });
    }

    public function createWithDetails(array $requestData, array $details): PulloutRequest
    {
        return DB::transaction(function () use ($requestData, $details) {
            // Create the pullout request
            $request = PulloutRequest::create($requestData);

            // Get the service order detail to find bay number
            $serviceOrderDetail = DB::table('service_order_details')
                ->join('service_orders', 'service_order_details.service_order_id', '=', 'service_orders.service_order_id')
                ->join('bays', 'service_orders.bay_id', '=', 'bays.bay_id')
                ->where('service_order_details.service_order_detail_id', $requestData['service_order_detail_id'])
                ->select('bays.bay_number')
                ->first();

            // Create pullout service record
            $pulloutService = PulloutService::create([
                'service_order_detail_id' => $requestData['service_order_detail_id'],
                'bay_number' => $serviceOrderDetail->bay_number ?? 'N/A',
            ]);
            $pulloutServiceId = $pulloutService->pullout_service_id;

            // Create pullout request details
            foreach ($details as $detail) {
                PulloutRequestDetail::create([
                    'pullout_request_id' => $request->pullout_request_id,
                    'pullout_service_id' => $pulloutServiceId,
                    'supply_id' => $detail['supply_id'],
                    'quantity' => $detail['quantity'],
                ]);
            }

            return $request->fresh(['employee', 'details']);
        });
    }

    public function approve(int $id, string $approvedBy): bool
    {
        return DB::transaction(function () use ($id, $approvedBy) {
            $request = PulloutRequest::with('details.supply')->findOrFail($id);

            // Update pullout request status
            $request->update([
                'is_approve' => true,
                'approve_by' => $approvedBy,
                'approve_date' => now(),
            ]);

            // Deduct supplies from inventory
            foreach ($request->details as $detail) {
                $supply = $detail->supply;
                $supply->decrement('quantity_stock', $detail->quantity);
            }

            return true;
        });
    }

    public function returnSupplies(int $detailId, string $returnedBy): bool
    {
        return DB::transaction(function () use ($detailId, $returnedBy) {
            $detail = PulloutRequestDetail::with('supply')->findOrFail($detailId);

            // Only process if supply is returnable (not consumable) and not already returned
            if ($detail->supply->supply_type === 'supply' && ! $detail->is_returned) {
                // Update the detail record
                $detail->update([
                    'is_returned' => true,
                    'returned_at' => now(),
                    'returned_by' => $returnedBy,
                ]);

                // Add the quantity back to inventory
                $detail->supply->increment('quantity_stock', (float) $detail->quantity);

                return true;
            }

            return false;
        });
    }

    public function getReturnablePullouts()
    {
        return DB::table('pullout_requests as pr')
            ->join('pullout_request_details as prd', 'pr.pullout_request_id', '=', 'prd.pullout_request_id')
            ->join('supplies as sup', 'prd.supply_id', '=', 'sup.supply_id')
            ->join('employees as e', 'pr.employee_id', '=', 'e.employee_id')
            ->join('pullout_services as ps', 'prd.pullout_service_id', '=', 'ps.pullout_service_id')
            ->join('service_order_details as sod', 'ps.service_order_detail_id', '=', 'sod.service_order_detail_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->join('service_orders as so', 'sod.service_order_id', '=', 'so.service_order_id')
            ->where('pr.is_approve', true)
            ->where('sup.supply_type', 'supply') // Only returnable supplies
            ->select(
                'prd.pullout_request_details_id',
                'pr.pullout_request_id',
                'pr.date_time as created_at',
                'so.service_order_id',
                's.service_name',
                'sv.size',
                DB::raw("CONCAT(e.first_name, ' ', e.last_name) as employee_name"),
                'sup.supply_name',
                'sup.unit',
                'prd.quantity',
                'prd.is_returned',
                'prd.returned_at',
                'prd.returned_by'
            )
            ->orderByDesc('pr.date_time')
            ->get();
    }

    public function getPaginatedRequests(int $perPage, ?string $search = null, ?string $status = null)
    {
        $query = DB::table('pullout_requests as pr')
            ->join('employees as e', 'pr.employee_id', '=', 'e.employee_id')
            ->join('pullout_request_details as prd', 'pr.pullout_request_id', '=', 'prd.pullout_request_id')
            ->join('pullout_services as ps', 'prd.pullout_service_id', '=', 'ps.pullout_service_id')
            ->join('service_order_details as sod', 'ps.service_order_detail_id', '=', 'sod.service_order_detail_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->join('service_orders as so', 'sod.service_order_id', '=', 'so.service_order_id')
            ->join('supplies as sup', 'prd.supply_id', '=', 'sup.supply_id')
            ->select(
                'pr.pullout_request_id',
                'pr.date_time as created_at',
                'pr.is_approve',
                'pr.approve_by',
                'pr.approve_date',
                'so.service_order_id',
                's.service_name',
                'sv.size',
                DB::raw("CONCAT(e.first_name, ' ', e.last_name) as employee_name"),
                DB::raw((DB::getDriverName() === 'pgsql' ? "STRING_AGG(CONCAT(sup.supply_name, ' (', prd.quantity, ' ', sup.unit, ')'), ', ')" : "GROUP_CONCAT(CONCAT(sup.supply_name, ' (', prd.quantity, ' ', sup.unit, ')') SEPARATOR ', ')").' as supplies')
            )
            ->groupBy(
                'pr.pullout_request_id',
                'pr.date_time',
                'pr.is_approve',
                'pr.approve_by',
                'pr.approve_date',
                'so.service_order_id',
                's.service_name',
                'e.first_name',
                'e.last_name',
                'sv.size'
            );

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw("CONCAT(e.first_name, ' ', e.last_name)"), 'like', "%{$search}%")
                    ->orWhere('s.service_name', 'like', "%{$search}%")
                    ->orWhere('pr.pullout_request_id', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            if ($status === 'approved') {
                $query->where('pr.is_approve', true);
            } elseif ($status === 'pending') {
                $query->where('pr.is_approve', false);
            }
        }

        $paginator = $query->orderByDesc('pr.date_time')->paginate($perPage);

        $paginator->getCollection()->transform(function ($item) {
            $item->status = $item->is_approve ? 'approved' : 'pending';
            // Get individual supply details for this request
            $details = DB::table('pullout_request_details as prd')
                ->join('supplies as sup', 'prd.supply_id', '=', 'sup.supply_id')
                ->where('prd.pullout_request_id', $item->pullout_request_id)
                ->select('sup.supply_name', 'prd.quantity', 'sup.unit', 'sup.supply_type')
                ->get();
            $item->details = $details;

            return $item;
        });

        return $paginator;
    }

    public function getPaginatedReturnablePullouts(int $perPage, ?string $search = null)
    {
        $query = DB::table('pullout_requests as pr')
            ->join('pullout_request_details as prd', 'pr.pullout_request_id', '=', 'prd.pullout_request_id')
            ->join('supplies as sup', 'prd.supply_id', '=', 'sup.supply_id')
            ->join('employees as e', 'pr.employee_id', '=', 'e.employee_id')
            ->join('pullout_services as ps', 'prd.pullout_service_id', '=', 'ps.pullout_service_id')
            ->join('service_order_details as sod', 'ps.service_order_detail_id', '=', 'sod.service_order_detail_id')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->join('service_orders as so', 'sod.service_order_id', '=', 'so.service_order_id')
            ->where('pr.is_approve', true)
            ->where('sup.supply_type', 'supply')
            ->select(
                'prd.pullout_request_details_id',
                'pr.pullout_request_id',
                'pr.date_time as created_at',
                'so.service_order_id',
                's.service_name',
                'sv.size',
                DB::raw("CONCAT(e.first_name, ' ', e.last_name) as employee_name"),
                'sup.supply_name',
                'sup.unit',
                'prd.quantity',
                'prd.is_returned',
                'prd.returned_at',
                'prd.returned_by'
            );

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where(DB::raw("CONCAT(e.first_name, ' ', e.last_name)"), 'like', "%{$search}%")
                    ->orWhere('s.service_name', 'like', "%{$search}%")
                    ->orWhere('sup.supply_name', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('pr.date_time')->paginate($perPage);
    }
}
