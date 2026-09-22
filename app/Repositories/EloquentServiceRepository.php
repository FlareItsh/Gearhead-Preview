<?php

namespace App\Repositories;

use App\Models\Service;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

// Added for debugging

class EloquentServiceRepository implements ServiceRepositoryInterface
{
    public function all(): Collection
    {
        return Service::where('status', 'active')
            ->with(['variants' => function ($query) {
                // You might want to filter variants too if they have a status,
                // but currently only services have status in the schema
            }])
            ->get();
    }

    public function allIncludingInactive(): Collection
    {
        return Service::with('variants')->get();
    }

    public function getAllByCategory(?string $category): Collection
    {
        $query = Service::where('status', 'active')->with('variants');

        if ($category && $category !== 'All') {
            $query->where('category', $category);
        }

        return $query->get();
    }

    public function findById(int $id): ?Service
    {
        return Service::with('variants')->find($id);
    }

    public function create(array $data): Service
    {
        return DB::transaction(function () use ($data) {
            $service = Service::create([
                'service_name' => $data['service_name'],
                'description' => $data['description'],
                'category' => $data['category'],
                'status' => $data['status'] ?? 'active',
            ]);

            if (isset($data['variants']) && is_array($data['variants'])) {
                foreach ($data['variants'] as $variantData) {
                    if ($variantData['enabled']) {
                        $service->variants()->create([
                            'size' => $variantData['size'],
                            'price' => $variantData['price'],
                            'estimated_duration' => $variantData['estimated_duration'] ?? $variantData['duration'] ?? 0,
                        ]);
                    }
                }
            }

            return $service;
        });
    }

    public function update(Service $service, array $data): bool
    {
        $result = DB::transaction(function () use ($service, $data) {
            $service->update([
                'service_name' => $data['service_name'] ?? $service->service_name,
                'description' => $data['description'] ?? $service->description,
                'category' => $data['category'] ?? $service->category,
                'status' => $data['status'] ?? $service->status,
            ]);

            if (isset($data['variants']) && is_array($data['variants'])) {
                \Log::info('Processing variants', ['variants' => $data['variants']]);

                $existingVariants = $service->variants->keyBy('size');
                $updatedSizes = [];

                foreach ($data['variants'] as $variantData) {
                    $size = $variantData['size'];
                    $updatedSizes[] = $size;

                    \Log::info('Processing variant', [
                        'size' => $size,
                        'enabled' => $variantData['enabled'],
                        'price' => $variantData['price'] ?? 'null',
                        'duration' => $variantData['estimated_duration'] ?? 'null',
                    ]);

                    if ($variantData['enabled']) {
                        if ($existingVariants->has($size)) {
                            \Log::info('Updating existing variant', ['size' => $size]);
                            $existingVariants[$size]->update([
                                'price' => $variantData['price'],
                                'estimated_duration' => $variantData['estimated_duration'] ?? $variantData['duration'] ?? 0,
                            ]);
                        } else {
                            \Log::info('Creating new variant', ['size' => $size]);
                            $service->variants()->create([
                                'size' => $size,
                                'price' => $variantData['price'],
                                'estimated_duration' => $variantData['estimated_duration'] ?? $variantData['duration'] ?? 0,
                            ]);
                        }
                    } else {
                        // If variant exists but is now "disabled" (not in current set of variants), delete it
                        if ($existingVariants->has($size)) {
                            \Log::info('Deleting disabled variant', ['size' => $size]);
                            $existingVariants[$size]->delete();
                        }
                    }
                }
            }

            return true;
        });

        // Refresh the service model to reload the variants relationship
        $service->refresh();

        return $result;
    }

    public function delete(Service $service): bool
    {
        return $service->delete();
    }

    public function getTopServices(int $limit = 4, ?string $startDate = null, ?string $endDate = null)
    {
        $query = DB::table('service_order_details as sod')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->join('service_orders as so', 'sod.service_order_id', '=', 'so.service_order_id')
            ->join('payments as p', 'so.service_order_id', '=', 'p.service_order_id')
            ->select(
                's.service_id',
                's.service_name',
                DB::raw('COALESCE(SUM(sod.quantity), 0) as total_bookings')
            )
            ->groupBy('s.service_id', 's.service_name')
            ->orderByDesc('total_bookings')
            ->limit($limit);

        if ($startDate && $endDate) {
            $query->whereBetween('p.created_at', [$startDate, $endDate]);
        }

        return $query->get();
    }

    /**
     * Get top services with size information for reports
     */
    public function getTopServicesWithSize(int $limit = 10, ?string $startDate = null, ?string $endDate = null)
    {
        $query = DB::table('service_order_details as sod')
            ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
            ->join('services as s', 'sv.service_id', '=', 's.service_id')
            ->join('service_orders as so', 'sod.service_order_id', '=', 'so.service_order_id')
            ->join('payments as p', 'so.service_order_id', '=', 'p.service_order_id')
            ->select(
                's.service_name',
                'sv.size',
                DB::raw('COALESCE(SUM(sod.quantity), 0) as total_bookings')
            )
            ->groupBy('s.service_id', 's.service_name', 'sv.size')
            ->orderByDesc('total_bookings')
            ->limit($limit);

        if ($startDate && $endDate) {
            $query->whereBetween('p.created_at', [$startDate, $endDate]);
        }

        return $query->get();
    }

    public function getDistinctCategories(): array
    {
        return Service::distinct()
            ->pluck('category')
            ->toArray();
    }
}
