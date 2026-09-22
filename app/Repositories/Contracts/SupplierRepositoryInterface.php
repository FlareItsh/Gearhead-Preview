<?php

namespace App\Repositories\Contracts;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Collection;

interface SupplierRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?Supplier;

    public function create(array $data): Supplier;

    public function update(Supplier $supplier, array $data): bool;

    public function delete(Supplier $supplier): bool;
}
