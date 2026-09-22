<?php

namespace App\Repositories;

use App\Repositories\Contracts\SupplyRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EloquentSupplyRepository implements SupplyRepositoryInterface
{
    public function all(): Collection
    {
        return DB::table('supplies')->get();
    }

    public function paginate(int $perPage, ?string $search = null, ?string $type = null)
    {
        $query = DB::table('supplies');

        if ($search) {
            $query->where('supply_name', 'like', "%{$search}%");
        }

        if ($type) {
            $query->where('supply_type', $type);
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id)
    {
        return DB::table('supplies')
            ->where('supply_id', $id)
            ->first();
    }

    public function create(array $data)
    {
        return DB::table('supplies')->insertGetId($data, 'supply_id');
    }

    public function update(int $id, array $data)
    {
        return DB::table('supplies')
            ->where('supply_id', $id)
            ->update($data) > 0;
    }

    public function incrementStock(int $id, float $quantity)
    {
        return DB::table('supplies')
            ->where('supply_id', $id)
            ->increment('quantity_stock', $quantity);
    }

    public function delete(int $id)
    {
        return DB::table('supplies')
            ->where('supply_id', $id)
            ->delete() > 0;
    }

    public function getLedger(int $supplyId, ?string $start_date = null, ?string $end_date = null)
    {
        $supply = DB::table('supplies')->where('supply_id', $supplyId)->first();
        $current_stock = $supply ? $supply->quantity_stock : 0;

        $forwarded_balance = 0;
        if ($start_date) {
            $total_purchases = DB::table('supply_purchase_details')
                ->join('supply_purchases', 'supply_purchase_details.supply_purchase_id', '=', 'supply_purchases.supply_purchase_id')
                ->where('supply_purchase_details.supply_id', $supplyId)
                ->whereDate('supply_purchases.created_at', '<', $start_date)
                ->sum('quantity');

            $total_pullouts = DB::table('pullout_request_details')
                ->join('pullout_requests', 'pullout_request_details.pullout_request_id', '=', 'pullout_requests.pullout_request_id')
                ->where('pullout_request_details.supply_id', $supplyId)
                ->where('pullout_requests.is_approve', true)
                ->whereDate('pullout_requests.created_at', '<', $start_date)
                ->sum('quantity');

            $total_returns = DB::table('pullout_request_details')
                ->where('supply_id', $supplyId)
                ->where('is_returned', true)
                ->whereDate('returned_at', '<', $start_date)
                ->sum('quantity');

            $total_services = DB::table('service_order_details')
                ->join('service_orders', 'service_order_details.service_order_id', '=', 'service_orders.service_order_id')
                ->join('service_retails', 'service_order_details.service_variant', '=', 'service_retails.service_variant_id')
                ->where('service_retails.supply_id', $supplyId)
                ->where('service_orders.status', 'completed')
                ->whereDate('service_orders.updated_at', '<', $start_date)
                ->join('supplies', 'service_retails.supply_id', '=', 'supplies.supply_id')
                ->sum(DB::raw('service_order_details.quantity * service_retails.quantity_needed / COALESCE(NULLIF(supplies.conversion_factor, 0), 1)'));

            $forwarded_balance = ($total_purchases + $total_returns) - ($total_pullouts + $total_services);
        }

        $isPgsql = DB::getDriverName() === 'pgsql';
        $nullStr = $isPgsql ? 'CAST(NULL AS VARCHAR)' : 'NULL';
        $toStr = $isPgsql ? 'CAST(%s AS VARCHAR)' : '%s';

        $purchases = DB::table('supply_purchase_details')
            ->join('supply_purchases', 'supply_purchase_details.supply_purchase_id', '=', 'supply_purchases.supply_purchase_id')
            ->join('suppliers', 'supply_purchases.supplier_id', '=', 'suppliers.supplier_id')
            ->where('supply_purchase_details.supply_id', $supplyId)
            ->when($start_date, function ($query, $start_date) {
                return $query->whereDate('supply_purchases.created_at', '>=', $start_date);
            })
            ->when($end_date, function ($query, $end_date) {
                return $query->whereDate('supply_purchases.created_at', '<=', $end_date);
            })
            ->select([
                'supply_purchases.created_at as date',
                DB::raw("'Purchase' as type"),
                DB::raw("CONCAT(suppliers.first_name, ' ', suppliers.last_name) as supplier_name"),
                DB::raw($nullStr.' as employee_name'),
                'supply_purchase_details.quantity as qty_in',
                DB::raw('0 as qty_out'),
                DB::raw(sprintf($toStr, 'supply_purchases.purchase_reference').' as reference_no'),
            ]);

        $pullouts = DB::table('pullout_request_details')
            ->join('pullout_requests', 'pullout_request_details.pullout_request_id', '=', 'pullout_requests.pullout_request_id')
            ->join('employees', 'pullout_requests.employee_id', '=', 'employees.employee_id')
            ->where('pullout_request_details.supply_id', $supplyId)
            ->where('pullout_requests.is_approve', true)
            ->when($start_date, function ($query, $start_date) {
                return $query->whereDate('pullout_requests.created_at', '>=', $start_date);
            })
            ->when($end_date, function ($query, $end_date) {
                return $query->whereDate('pullout_requests.created_at', '<=', $end_date);
            })
            ->select([
                'pullout_requests.created_at as date',
                DB::raw("'Pullout' as type"),
                DB::raw($nullStr.' as supplier_name'),
                DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                DB::raw('0 as qty_in'),
                'pullout_request_details.quantity as qty_out',
                DB::raw(sprintf($toStr, 'pullout_requests.pullout_request_id').' as reference_no'),
            ]);

        $returns = DB::table('pullout_request_details')
            ->join('pullout_requests', 'pullout_request_details.pullout_request_id', '=', 'pullout_requests.pullout_request_id')
            ->join('employees', 'pullout_requests.employee_id', '=', 'employees.employee_id')
            ->where('pullout_request_details.supply_id', $supplyId)
            ->where('pullout_request_details.is_returned', true)
            ->when($start_date, function ($query, $start_date) {
                return $query->whereDate('pullout_request_details.returned_at', '>=', $start_date);
            })
            ->when($end_date, function ($query, $end_date) {
                return $query->whereDate('pullout_request_details.returned_at', '<=', $end_date);
            })
            ->select([
                'pullout_request_details.returned_at as date',
                DB::raw("'Return' as type"),
                DB::raw($nullStr.' as supplier_name'),
                DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                'pullout_request_details.quantity as qty_in',
                DB::raw('0 as qty_out'),
                DB::raw(sprintf($toStr, 'pullout_requests.pullout_request_id').' as reference_no'),
            ]);

        $services = DB::table('service_order_details')
            ->join('service_orders', 'service_order_details.service_order_id', '=', 'service_orders.service_order_id')
            ->join('service_variants', 'service_order_details.service_variant', '=', 'service_variants.service_variant')
            ->join('service_retails', 'service_variants.service_variant', '=', 'service_retails.service_variant_id')
            ->join('supplies', 'service_retails.supply_id', '=', 'supplies.supply_id')
            ->leftJoin('employees', 'service_orders.employee_id', '=', 'employees.employee_id')
            ->where('service_retails.supply_id', $supplyId)
            ->where('service_orders.status', 'completed')
            ->when($start_date, function ($query, $start_date) {
                return $query->whereDate('service_orders.updated_at', '>=', $start_date);
            })
            ->when($end_date, function ($query, $end_date) {
                return $query->whereDate('service_orders.updated_at', '<=', $end_date);
            })
            ->select([
                'service_orders.updated_at as date',
                DB::raw("'Service' as type"),
                DB::raw($nullStr.' as supplier_name'),
                DB::raw("CONCAT(employees.first_name, ' ', employees.last_name) as employee_name"),
                DB::raw('0 as qty_in'),
                DB::raw('service_order_details.quantity * service_retails.quantity_needed / COALESCE(NULLIF(supplies.conversion_factor, 0), 1) as qty_out'),
                DB::raw(sprintf($toStr, 'service_orders.service_order_id').' as reference_no'),
            ]);

        $entries = $purchases
            ->unionAll($pullouts)
            ->unionAll($returns)
            ->unionAll($services)
            ->orderBy('date', 'asc')
            ->get();

        return [
            'current_stock' => $current_stock,
            'forwarded_balance' => $forwarded_balance,
            'entries' => $entries,
        ];
    }
}
