<?php

namespace App\Repositories\Contracts;

use App\Models\Payment;
use Illuminate\Database\Eloquent\Collection;

interface PaymentRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?Payment;

    public function create(array $data): Payment;

    public function update(Payment $payment, array $data): bool;

    public function delete(Payment $payment): bool;

    /**
     * Return the total number of payments for a given user id.
     */
    public function countByUserId(int $userId): int;

    /**
     * Return the total amount spent by a given user id.
     */
    public function totalSpent(int $userId): int;

    /**
     * Return all payments for a given user id, including joined service names.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getPaymentsForUser(int $userId);

    /**
     * Get total amount and count of payments within a date range.
     */
    public function getSummaryByDateRange(string $startDate, string $endDate): array;

    /**
     * Get monthly revenue for a specific year.
     */
    public function getMonthlyRevenueByYear(int $year): array;

    /**
     * Get financial summary (revenue, expenses, profit) by date range.
     */
    public function getFinancialSummaryByDateRange(string $startDate, string $endDate): array;

    /**
     * Get average booking value by date range.
     */
    public function getAverageBookingValueByDateRange(string $startDate, string $endDate): float;

    /**
     * Get customer retention rate for a specific date range.
     */
    public function getCustomerRetentionRateByDateRange(string $startDate, string $endDate): float;

    /**
     * Get all transactions with customer and service details.
     */
    public function getAllTransactions();

    /**
     * Get transactions within a specified date range.
     */
    public function getTransactionsByDateRange(string $startDate, string $endDate);

    /**
     * Get paginated transactions.
     */
    public function getPaginatedTransactions(int $perPage, ?string $search = null, ?string $startDate = null, ?string $endDate = null);

    /**
     * Get paginated payments for a specific user.
     */
    public function getPaginatedPaymentsForUser(int $userId, int $perPage);
}
