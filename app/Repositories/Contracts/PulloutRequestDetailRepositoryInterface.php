<?php

namespace App\Repositories\Contracts;

use App\Models\PulloutRequestDetail;
use Illuminate\Database\Eloquent\Collection;

interface PulloutRequestDetailRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?PulloutRequestDetail;

    public function create(array $data): PulloutRequestDetail;

    public function update(PulloutRequestDetail $detail, array $data): bool;

    public function delete(PulloutRequestDetail $detail): bool;
}
