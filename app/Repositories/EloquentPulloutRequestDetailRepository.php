<?php

namespace App\Repositories;

use App\Models\PulloutRequestDetail;
use App\Repositories\Contracts\PulloutRequestDetailRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentPulloutRequestDetailRepository implements PulloutRequestDetailRepositoryInterface
{
    public function all(): Collection
    {
        return PulloutRequestDetail::all();
    }

    public function findById(int $id): ?PulloutRequestDetail
    {
        return PulloutRequestDetail::find($id);
    }

    public function create(array $data): PulloutRequestDetail
    {
        return PulloutRequestDetail::create($data);
    }

    public function update(PulloutRequestDetail $detail, array $data): bool
    {
        return $detail->update($data);
    }

    public function delete(PulloutRequestDetail $detail): bool
    {
        return $detail->delete();
    }
}
