<?php

namespace App\Repositories\Contracts;

use App\Models\Service;
use Illuminate\Database\Eloquent\Collection;

interface ServiceRepositoryInterface
{
    public function all(): Collection;

    public function allIncludingInactive(): Collection;

    public function findById(int $id): ?Service;

    public function create(array $data): Service;

    public function update(Service $service, array $data): bool;

    public function delete(Service $service): bool;

    public function getAllByCategory(?string $category);

    /**
     * Get top N most booked services
     *
     * @return \Illuminate\Support\Collection
     */
    public function getTopServices(int $limit = 4, ?string $startDate = null, ?string $endDate = null);

    /**
     * Get top N services with size information for reports
     *
     * @return \Illuminate\Support\Collection
     */
    public function getTopServicesWithSize(int $limit = 10, ?string $startDate = null, ?string $endDate = null);

    /**
     * Get the single most popular service
     *
     * @return object|null
     */

    /**
     * Get all distinct service categories.
     */
    public function getDistinctCategories(): array;
}
