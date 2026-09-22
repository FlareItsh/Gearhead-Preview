<?php

namespace App\Http\Controllers;

use App\Http\Requests\Settings\StoreCarRequest;
use App\Repositories\Contracts\CarRepositoryInterface;
use App\Support\VehicleSizeResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CarController extends Controller
{
    public function __construct(protected CarRepositoryInterface $cars, protected VehicleSizeResolver $vehicleSizes) {}

    /**
     * Store a newly created car in storage.
     */
    public function store(StoreCarRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['user_id'] = $request->user()->user_id;
        $validated['size'] = $this->vehicleSizes->resolve(
            $validated['make'],
            $validated['model'],
            null,
            trim(($validated['make'] ?? '').' '.($validated['model'] ?? ''))
        );

        $this->cars->create($validated);

        return back()->with('status', 'car-added');
    }

    /**
     * Remove the specified car from storage.
     */
    public function destroy(int $id): RedirectResponse
    {
        $car = $this->cars->find($id);

        if ($car->user_id !== Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $this->cars->delete($id);

        return back()->with('status', 'car-deleted');
    }

    /**
     * Suggest vehicles from the local Philippine vehicle size index.
     */
    public function suggest(Request $request): JsonResponse
    {
        return response()->json($this->vehicleSizes->suggest(
            (string) $request->query('field', 'model'),
            (string) $request->query('query', ''),
            (string) $request->query('make', '')
        )->values());
    }
}
