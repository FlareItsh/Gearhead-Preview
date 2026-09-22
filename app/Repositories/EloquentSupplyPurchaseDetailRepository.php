<?php

namespace App\Repositories;

use App\Models\SupplyPurchaseDetail;
use App\Repositories\Contracts\SupplyPurchaseDetailRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class EloquentSupplyPurchaseDetailRepository implements SupplyPurchaseDetailRepositoryInterface
{
    public function all(): Collection
    {
        return SupplyPurchaseDetail::all();
    }

    public function findById(int $id): ?SupplyPurchaseDetail
    {
        return SupplyPurchaseDetail::find($id);
    }

    public function create(array $data): SupplyPurchaseDetail
    {
        return SupplyPurchaseDetail::create($data);
    }

    public function update(SupplyPurchaseDetail $detail, array $data): bool
    {
        return $detail->update($data);
    }

    public function delete(SupplyPurchaseDetail $detail): bool
    {
        return $detail->delete();
    }

    public function getFinancialSummary(?string $startDate = null, ?string $endDate = null)
    {
        // Default to last 30 days
        $startDate = $startDate ?? now()->subDays(30)->format('Y-m-d');
        $endDate = $endDate ?? now()->format('Y-m-d');

        $total_expenses = DB::table('supply_purchase_details')
            ->selectRaw('SUM(quantity * unit_price) as total')
            ->whereBetween('purchase_date', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->value('total') ?? 0;

        return [
            'total_expenses' => (float) $total_expenses,
            'total_revenue' => 0,
            'total_profit' => 0 - (float) $total_expenses,
        ];
    }
}
