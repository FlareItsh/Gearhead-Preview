<?php

namespace App\Repositories\Contracts;

use App\Models\ServiceOrder;
use Illuminate\Database\Eloquent\Collection;

interface ServiceOrderRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?ServiceOrder;

    public function findByUserAndDate(int $userId, string $orderDate): ?ServiceOrder;

    public function create(array $data): ServiceOrder;

    /**
     * Create a service order together with its details in a transaction.
     *
     * @param  array  $details  Array of arrays with keys: service_id, quantity
     */
    public function createWithDetails(array $orderData, array $details): ServiceOrder;

    public function update(ServiceOrder $order, array $data): bool;

    public function delete(ServiceOrder $order): bool;

    public function upcomingBookings(int $userId);

    public function getOrdersWithStatus(?string $status = null);

    /**
     * Get pending service orders with:
     *  - customer name
     *  - comma separated service names
     *  - order time
     *  - status
     */
    public function getPendingOrders();

    /**
     * Get all bookings with date range filter.
     * Returns orders with customer name, service names, total price, and status.
     * Sorts pending orders first, then by date descending.
     *
     * @param  string|null  $startDate  Y-m-d format
     * @param  string|null  $endDate  Y-m-d format
     * @return \Illuminate\Support\Collection
     */
    public function getAllBookings(?string $startDate = null, ?string $endDate = null, ?string $sortBy = 'order_date', ?string $sortOrder = 'asc');

    /**
     * Get paginated bookings with filters.
     */
    public function getPaginatedBookings(int $perPage, ?string $search = null, ?string $startDate = null, ?string $endDate = null, ?string $status = null, ?string $sortBy = 'order_date', ?string $sortOrder = 'asc');

    /**
     * Delete all service order details for a service order.
     */
    public function deleteServiceOrderDetails(int $serviceOrderId): bool;

    /**
     * Replace service order details with new service IDs.
     */
    public function replaceServiceOrderDetails(int $serviceOrderId, array $serviceIds): void;

    /**
     * Replace service order details with new variant IDs.
     */
    public function replaceServiceOrderDetailsWithVariants(int $serviceOrderId, array $variantIds): void;

    /**
     * Get today's pending reservation bookings with customer and service details.
     */
    public function getTodayBookings();

    /**
     * Cancel a booking by updating its status to cancelled.
     */
    public function cancelBooking(int $serviceOrderId): bool;

    /**
     * Count completed service orders with payments for a user.
     */
    public function countCompletedBookingsForUser(int $userId): int;

    /**
     * Get active service orders (pending or in_progress) with full relationships.
     */
    public function getActiveOrders();
}
