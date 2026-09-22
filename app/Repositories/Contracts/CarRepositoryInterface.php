<?php

namespace App\Repositories\Contracts;

use App\Models\Car;
use Illuminate\Support\Collection;

interface CarRepositoryInterface
{
    /**
     * Get all cars.
     *
     * @return Collection<Car>
     */
    public function all(): Collection;

    /**
     * Find a car by ID.
     */
    public function find(int $id): Car;

    /**
     * Create a new car.
     */
    public function create(array $data): Car;

    /**
     * Update an existing car.
     */
    public function update(int $id, array $data): Car;

    /**
     * Delete a car by ID.
     */
    public function delete(int $id): bool;

    /**
     * Get all cars belonging to a specific user.
     *
     * @return Collection<Car>
     */
    public function getByUserId(int $userId): Collection;
}
