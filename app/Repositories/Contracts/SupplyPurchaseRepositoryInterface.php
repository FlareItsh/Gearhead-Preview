<?php

namespace App\Repositories\Contracts;

use App\Models\SupplyPurchase;
use Illuminate\Database\Eloquent\Collection;

interface SupplyPurchaseRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?SupplyPurchase;

    public function create(array $data): SupplyPurchase;

    public function update(SupplyPurchase $purchase, array $data): bool;

    public function delete(SupplyPurchase $purchase): bool;

    /**
     * Get financial summary: daily revenue, expenses, profit for a date range (time-series).
     *
     * @return array<array{date: string, revenue: float, expenses: float, profit: float}>
     */
    public function getFinancialSummary(?string $startDate = null, ?string $endDate = null);

    /**
     * Get supply purchases with detailed information including concatenated supplies and total amount.
     *
     * @return array<array{supply_purchase_id: int, purchase_date: string, purchase_reference: string, supplier_name: string, supplies: string, total_amount: float, status: string}>
     */
    public function getDetailedPurchases(?string $startDate = null, ?string $endDate = null);

    /**
     * Get paginated detailed purchases.
     */
    public function paginateDetailedPurchases(int $perPage, ?string $search = null, ?string $startDate = null, ?string $endDate = null);
}
