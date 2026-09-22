<?php

namespace App\Repositories;

use App\Models\Car;
use App\Repositories\Contracts\CarRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentCarRepository implements CarRepositoryInterface
{
    public function all(): Collection
    {
        return Car::latest()->get();
    }

    public function find(int $id): Car
    {
        return Car::findOrFail($id);
    }

    public function create(array $data): Car
    {
        return Car::create($data);
    }

    public function update(int $id, array $data): Car
    {
        $car = Car::findOrFail($id);
        $car->update($data);

        return $car;
    }

    public function delete(int $id): bool
    {
        $car = Car::findOrFail($id);

        return $car->delete();
    }

    public function getByUserId(int $userId): Collection
    {
        return Car::where('user_id', $userId)->latest()->get();
    }
}
