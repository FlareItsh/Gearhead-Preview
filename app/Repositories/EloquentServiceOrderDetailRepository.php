<?php

namespace App\Repositories;

use App\Models\ServiceOrderDetail;
use App\Repositories\Contracts\ServiceOrderDetailRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentServiceOrderDetailRepository implements ServiceOrderDetailRepositoryInterface
{
    public function all(): Collection
    {
        return ServiceOrderDetail::all();
    }

    public function findById(int $id): ?ServiceOrderDetail
    {
        return ServiceOrderDetail::find($id);
    }

    public function create(array $data): ServiceOrderDetail
    {
        return ServiceOrderDetail::create($data);
    }

    public function update(ServiceOrderDetail $detail, array $data): bool
    {
        return $detail->update($data);
    }

    public function delete(ServiceOrderDetail $detail): bool
    {
        return $detail->delete();
    }
}
