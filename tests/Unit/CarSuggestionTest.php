<?php

use App\Http\Controllers\CarController;
use App\Models\Car;
use App\Repositories\Contracts\CarRepositoryInterface;
use App\Support\VehicleSizeResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

uses(Tests\TestCase::class);

function carSuggestionController(): CarController
{
    return new CarController(new class implements CarRepositoryInterface
    {
        public function all(): Collection
        {
            return collect();
        }

        public function find(int $id): Car
        {
            return new Car;
        }

        public function create(array $data): Car
        {
            return new Car($data);
        }

        public function update(int $id, array $data): Car
        {
            return new Car($data);
        }

        public function delete(int $id): bool
        {
            return true;
        }

        public function getByUserId(int $userId): Collection
        {
            return collect();
        }
    }, new VehicleSizeResolver);
}

test('model suggestions prefer the selected make and typed model prefix', function () {
    $response = carSuggestionController()->suggest(Request::create('/api/cars/suggest', 'GET', [
        'make' => 'Toyota',
        'query' => 'wi',
    ]));

    $suggestions = $response->getData(true);

    expect($suggestions[0])
        ->make->toBe('Toyota')
        ->model->toBe('Wigo')
        ->size->toBe('Small');
});

test('vehicle size resolver follows knowledge base api class heuristics and default order', function () {
    $resolver = new VehicleSizeResolver;

    expect($resolver->resolve('BYD', 'Atto 3'))->toBe('Large')
        ->and($resolver->resolve('Unknown', 'Mystery', 'standard pickup truck'))->toBe('XX-Large')
        ->and($resolver->resolve('Unknown', 'Mystery Wigo'))->toBe('Small')
        ->and($resolver->resolve('', ''))->toBe('Medium');
});
