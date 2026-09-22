<?php

namespace App\Repositories\Contracts;

use App\Models\ServiceOrderDetail;
use Illuminate\Database\Eloquent\Collection;

interface ServiceOrderDetailRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?ServiceOrderDetail;

    public function create(array $data): ServiceOrderDetail;

    public function update(ServiceOrderDetail $detail, array $data): bool;

    public function delete(ServiceOrderDetail $detail): bool;
}
