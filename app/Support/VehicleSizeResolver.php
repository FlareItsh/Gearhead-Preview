<?php

namespace App\Support;

use Illuminate\Support\Collection;

class VehicleSizeResolver
{
    /**
     * @return array<int, array{make: string, model: string, size: string}>
     */
    public function entries(): array
    {
        $contents = file_get_contents(resource_path('data/philippine-vehicle-sizes.json'));

        if ($contents === false) {
            return [];
        }

        return json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
    }

    public function resolve(string $make = '', string $model = '', ?string $apiClass = null, ?string $rawText = null): string
    {
        $normalizedMake = $this->compact($make);
        $normalizedModel = $this->compact($model);

        foreach ($this->entries() as $entry) {
            if ($this->compact($entry['make']) === $normalizedMake && $this->compact($entry['model']) === $normalizedModel) {
                return $entry['size'];
            }
        }

        $classSize = $this->sizeFromApiClass((string) $apiClass);

        if ($classSize !== null) {
            return $classSize;
        }

        return $this->sizeFromText(trim($make.' '.$model.' '.((string) $rawText)));
    }

    public function hasExactVehicle(string $make, string $model): bool
    {
        $normalizedMake = $this->compact($make);
        $normalizedModel = $this->compact($model);

        foreach ($this->entries() as $entry) {
            if ($this->compact($entry['make']) === $normalizedMake && $this->compact($entry['model']) === $normalizedModel) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return Collection<int, array{make: string, model: string, size: string, class: null, year: null}>
     */
    public function suggest(string $field, string $query, string $make = ''): Collection
    {
        $field = $field === 'make' ? 'make' : 'model';
        $query = trim($query);

        if (strlen($query) < 2) {
            return collect();
        }

        $entries = collect($this->entries());

        if ($field === 'model' && strlen(trim($make)) >= 2) {
            $normalizedMake = $this->compact($make);
            $entries = $entries->filter(fn (array $entry): bool => $this->compact($entry['make']) === $normalizedMake);
        }

        $normalizedQuery = $this->normalize($query);
        $compactQuery = $this->compact($query);

        return $entries
            ->filter(function (array $entry) use ($field, $normalizedQuery, $compactQuery): bool {
                return str_contains($this->normalize($entry[$field]), $normalizedQuery)
                    || str_contains($this->compact($entry[$field]), $compactQuery);
            })
            ->sortBy(function (array $entry) use ($field, $query): array {
                $value = $entry[$field];

                return [
                    str_starts_with($this->normalize($value), $this->normalize($query)) ? 0 : 1,
                    str_contains($this->normalize($value), $this->normalize($query)) ? 0 : 1,
                    str_starts_with($this->compact($value), $this->compact($query)) ? 0 : 1,
                    $value,
                ];
            })
            ->unique(fn (array $entry): string => $field === 'make' ? $this->compact($entry['make']) : $this->compact($entry['make'].' '.$entry['model']))
            ->values()
            ->map(fn (array $entry): array => [
                'make' => $entry['make'],
                'model' => $entry['model'],
                'size' => $entry['size'],
                'class' => null,
                'year' => null,
            ]);
    }

    private function sizeFromApiClass(string $apiClass): ?string
    {
        return match ($this->normalize($apiClass)) {
            'minicompact car', 'subcompact car', 'two seater' => 'Small',
            'compact car', 'small station wagon' => 'Medium',
            'midsize car', 'midsize station wagon', 'small sport utility vehicle' => 'Large',
            'large car', 'standard sport utility vehicle', 'small pickup truck', 'minivan' => 'X-Large',
            'standard pickup truck', 'vans' => 'XX-Large',
            default => null,
        };
    }

    private function sizeFromText(string $text): string
    {
        $normalizedText = $this->normalize($text);

        $rules = [
            'XX-Large' => ['jeepney', 'heavy duty', 'cargo', 'long wheelbase'],
            'X-Large' => ['pickup', 'truck', 'full size suv', 'raptor', '4x4', 'f 150', 'silverado'],
            'Large' => ['midsize', 'crossover', 'wagon', 'utility'],
            'Medium' => ['compact', 'sedan', 'hatchback'],
            'Small' => ['mini', 'micro', 'sub', 'city car', 'brio', 'wigo', 'alto', 'mira'],
        ];

        foreach ($rules as $size => $terms) {
            foreach ($terms as $term) {
                if (str_contains($normalizedText, $term)) {
                    return $size;
                }
            }
        }

        return 'Medium';
    }

    private function normalize(string $value): string
    {
        $normalized = preg_replace('/[^a-z0-9]+/', ' ', strtolower(trim($value)));

        return trim((string) $normalized);
    }

    private function compact(string $value): string
    {
        return str_replace(' ', '', $this->normalize($value));
    }
}
