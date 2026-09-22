<?php

namespace App\Repositories\Contracts;

interface SupplyRepositoryInterface
{
    public function all();

    public function paginate(int $perPage, ?string $search = null, ?string $type = null);

    public function findById(int $id);

    public function create(array $data);

    public function update(int $id, array $data);

    public function incrementStock(int $id, float $quantity);

    public function delete(int $id);

    public function getLedger(int $supplyId, ?string $start_date = null, ?string $end_date = null);
}
