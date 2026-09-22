<?php

namespace App\Repositories\Contracts;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface UserRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?User;

    public function findByEmail(string $email): ?User;

    public function create(array $data): User;

    public function update(User $user, array $data): bool;

    public function delete(User $user): bool;

    public function getCustomersWithBookings();

    /**
     * Get paginated customers with search.
     */
    public function getPaginatedCustomers(int $perPage, ?string $search = null, ?string $role = null);
}
