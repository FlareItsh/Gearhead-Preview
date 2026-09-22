<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\BayRepositoryInterface;
use Illuminate\Http\Request;

class BayController extends Controller
{
    public function __construct(private BayRepositoryInterface $bayRepository) {}

    public function index()
    {
        return response()->json($this->bayRepository->all());
    }

    public function show(int $id)
    {
        try {
            $bay = $this->bayRepository->find($id);

            return response()->json($bay);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Not found'], 404);
        }
    }

    public function store(Request $request)
    {
        if (! $request->user() || ! $request->user()->hasPermission('add_bay')) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'bay_number' => 'required|integer|unique:bays',
            'bay_type' => 'required|string',
            'status' => 'required|string|in:available,occupied,maintenance',
        ]);

        $bay = $this->bayRepository->create($validated);

        return response()->json($bay, 201);
    }

    public function update(Request $request, int $id)
    {
        if (! $request->user() || ! $request->user()->hasPermission('edit_bay')) {
            abort(403, 'Unauthorized action.');
        }

        try {
            $currentBay = $this->bayRepository->find($id);

            if ($currentBay->status === 'occupied') {
                return response()->json([
                    'message' => 'Occupied bays cannot be updated.',
                    'errors' => ['status' => ['This bay is currently occupied and cannot be modified.']],
                ], 422);
            }

            $validated = $request->validate([
                'bay_number' => 'sometimes|integer|unique:bays,bay_number,'.$id.',bay_id',
                'bay_type' => 'sometimes|string',
                'status' => 'sometimes|string|in:available,occupied,maintenance',
            ]);

            $bay = $this->bayRepository->update($id, $validated);

            return response()->json($bay);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Not found'], 404);
        }
    }

    public function destroy(Request $request, int $id)
    {
        if (! $request->user() || ! $request->user()->hasPermission('delete_bay')) {
            abort(403, 'Unauthorized action.');
        }

        try {
            $currentBay = $this->bayRepository->find($id);

            if ($currentBay->status === 'occupied') {
                return response()->json([
                    'message' => 'Occupied bays cannot be deleted.',
                    'errors' => ['status' => ['This bay is currently occupied and cannot be deleted.']],
                ], 422);
            }

            $this->bayRepository->delete($id);

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Not found'], 404);
        }
    }

    public function available()
    {
        return response()->json($this->bayRepository->getAvailable());
    }
}
