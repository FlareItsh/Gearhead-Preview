<?php

namespace App\Repositories\Contracts;

use App\Models\PulloutRequest;
use Illuminate\Database\Eloquent\Collection;

interface PulloutRequestRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?PulloutRequest;

    public function create(array $data): PulloutRequest;

    public function update(PulloutRequest $request, array $data): bool;

    public function delete(PulloutRequest $request): bool;

    /**
     * Get pullout requests with employee and supply details
     */
    public function getAllWithDetails();

    /**
     * Create pullout request with details
     */
    public function createWithDetails(array $requestData, array $details): PulloutRequest;

    /**
     * Approve a pullout request
     */
    public function approve(int $id, string $approvedBy): bool;

    /**
     * Mark supplies as returned and restore inventory
     */
    public function returnSupplies(int $detailId, string $returnedBy): bool;

    /**
     * Get all approved pullout requests with returnable supplies
     */
    public function getPaginatedRequests(int $perPage, ?string $search = null, ?string $status = null);

    /**
     * Get all approved pullout requests with returnable supplies
     */
    public function getReturnablePullouts();

    /**
     * Get paginated returnable pullouts
     */
    public function getPaginatedReturnablePullouts(int $perPage, ?string $search = null);
}
