<?php

namespace App\Repositories\Contracts;

use App\Models\SupplyPurchaseDetail;
use Illuminate\Database\Eloquent\Collection;

interface SupplyPurchaseDetailRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?SupplyPurchaseDetail;

    public function create(array $data): SupplyPurchaseDetail;

    public function update(SupplyPurchaseDetail $detail, array $data): bool;

    public function delete(SupplyPurchaseDetail $detail): bool;

    /**
     * Get financial summary: expenses, revenue, profit for a date range.
     *
     * @return array{total_expenses: float, total_revenue: float, total_profit: float}
     */
    public function getFinancialSummary(?string $startDate = null, ?string $endDate = null);
}
