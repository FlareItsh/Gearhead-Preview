<?php

namespace App\Repositories\Contracts;

use App\Models\PulloutService;
use Illuminate\Database\Eloquent\Collection;

interface PulloutServiceRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?PulloutService;

    public function create(array $data): PulloutService;

    public function update(PulloutService $service, array $data): bool;

    public function delete(PulloutService $service): bool;

    /**
     * Get pullout services with related data
     */
    public function getAllWithDetails();

    /**
     * Get active service orders with employee assignments for pullout
     */
    public function getActiveServiceOrdersForPullout();
}
