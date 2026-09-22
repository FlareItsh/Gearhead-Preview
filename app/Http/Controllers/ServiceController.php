<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceController extends Controller
{
    protected ServiceRepositoryInterface $repo;

    public function __construct(ServiceRepositoryInterface $repo)
    {
        $this->repo = $repo;
    }

    public function index()
    {
        return response()->json($this->repo->all());
    }

    public function show(int $id)
    {
        $item = $this->repo->findById($id);

        return $item ? response()->json($item) : response()->json(['message' => 'Not found'], 404);
    }

    public function store(Request $request)
    {
        if (! $request->user() || ! $request->user()->hasPermission('add_service')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'service_name' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'status' => 'required|in:active,inactive',
            'variants' => 'required|array|min:1',
            'variants.*.size' => 'required|string',
            'variants.*.enabled' => 'required|boolean',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.estimated_duration' => 'nullable|integer|min:0',
        ]);

        // Filter to only enabled variants for creation
        $validated['variants'] = array_filter($validated['variants'], fn ($v) => $v['enabled']);

        $created = $this->repo->create($validated);

        return response()->json($created, 201);
    }

    public function update(Request $request, int $id)
    {
        if (! $request->user() || ! $request->user()->hasPermission('edit_service')) {
            abort(403, 'Unauthorized action.');
        }

        $service = $this->repo->findById($id);
        if (! $service) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $validated = $request->validate([
            'service_name' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'category' => 'sometimes|required|string',
            'status' => 'sometimes|required|in:active,inactive',
            'variants' => 'sometimes|required|array|min:1',
            'variants.*.size' => 'required|string',
            'variants.*.enabled' => 'required|boolean',
            'variants.*.price' => 'nullable|numeric|min:0',
            'variants.*.estimated_duration' => 'nullable|integer|min:0',
        ]);

        \Log::info('Service Update Request', [
            'service_id' => $id,
            'validated_data' => $validated,
        ]);

        $this->repo->update($service, $validated);

        // Reload the service with fresh variants
        $updated = $this->repo->findById($id);

        \Log::info('Service After Update', [
            'service_id' => $id,
            'variants_count' => $updated->variants->count(),
            'variants' => $updated->variants->toArray(),
        ]);

        return response()->json($updated);
    }

    public function destroy(int $id)
    {
        $item = $this->repo->findById($id);
        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->repo->delete($item);

        return response()->json(null, 204);
    }

    /**
     * Get top N best-selling services.
     */
    /**
     * Get top 10 services for Bar chart
     */
    public function topServices(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $services = $this->repo->getTopServices(4, $startDate, $endDate);

        return response()->json($services);
    }

    /**
     * Get top 10 services with size for Reports page
     */
    public function topServicesWithSize(Request $request)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $services = $this->repo->getTopServicesWithSize(10, $startDate, $endDate);

        return response()->json($services);
    }

    public function getRetails(int $variantId): \Illuminate\Http\JsonResponse
    {
        $retails = DB::table('service_retails')
            ->join('supplies', 'service_retails.supply_id', '=', 'supplies.supply_id')
            ->where('service_variant_id', $variantId)
            ->select([
                'service_retails.id',
                'service_retails.service_variant_id',
                'service_retails.supply_id',
                'service_retails.quantity_needed',
                'supplies.supply_name',
                'supplies.base_unit',
            ])
            ->get();

        return response()->json($retails);
    }

    public function updateRetails(Request $request, int $variantId): \Illuminate\Http\JsonResponse
    {
        if (! $request->user() || ! $request->user()->hasPermission('edit_service')) {
            abort(403, 'Unauthorized action.');
        }

        if (! DB::table('service_variants')->where('service_variant', $variantId)->exists()) {
            return response()->json(['message' => 'Service variant not found'], 404);
        }

        $validated = $request->validate([
            'retails' => 'present|array',
            'retails.*.supply_id' => 'required|integer|distinct|exists:supplies,supply_id',
            'retails.*.quantity_needed' => 'required|numeric|min:0',
        ], [
            'retails.*.supply_id.distinct' => 'Each supply can only be added once per service variant.',
        ]);

        $retails = collect($validated['retails'])
            ->filter(fn (array $retail): bool => (float) $retail['quantity_needed'] > 0)
            ->values();

        DB::transaction(function () use ($variantId, $retails) {
            DB::table('service_retails')->where('service_variant_id', $variantId)->delete();

            foreach ($retails as $retail) {
                DB::table('service_retails')->insert([
                    'service_variant_id' => $variantId,
                    'supply_id' => $retail['supply_id'],
                    'quantity_needed' => $retail['quantity_needed'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        return response()->json(['message' => 'Service retails updated successfully']);
    }
}
