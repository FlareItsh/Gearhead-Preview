<?php

namespace App\Repositories\Contracts;

use App\Models\Bay;
use Illuminate\Support\Collection;

interface BayRepositoryInterface
{
    /**
     * Get all bays.
     *
     * @return Collection<Bay>
     */
    public function all(): Collection;

    /**
     * Find a bay by ID.
     */
    public function find(int $id): Bay;

    /**
     * Create a new bay.
     */
    public function create(array $data): Bay;

    /**
     * Update an existing bay.
     */
    public function update(int $id, array $data): Bay;

    /**
     * Delete a bay by ID.
     */
    public function delete(int $id): bool;

    /**
     * Get all available bays.
     */
    public function getAvailable(): Collection;

    /**
     * Update bay status.
     */
    public function updateStatus(int $id, string $status): bool;
}
