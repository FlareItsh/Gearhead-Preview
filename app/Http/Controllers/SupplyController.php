<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\SupplyRepositoryInterface;
use Illuminate\Http\Request;

class SupplyController extends Controller
{
    protected SupplyRepositoryInterface $repo;

    public function __construct(SupplyRepositoryInterface $repo)
    {
        $this->repo = $repo;
    }

    public function index(Request $request)
    {
        if ($request->has('all')) {
            return response()->json($this->repo->all());
        }

        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');
        $type = $request->input('type');

        return response()->json($this->repo->paginate($perPage, $search, $type));
    }

    public function show(int $id)
    {
        $item = $this->repo->findById($id);

        return $item
            ? response()->json($item)
            : response()->json(['message' => 'Not found'], 404);
    }

    public function store(Request $request)
    {
        if (! $request->user() || ! $request->user()->hasPermission('add_inventory_item')) {
            abort(403, 'Unauthorized action.');
        }

        $id = $this->repo->create($request->all());
        $item = $this->repo->findById($id);

        return response()->json($item, 201);
    }

    public function update(Request $request, int $id)
    {
        if (! $request->user() || ! $request->user()->hasPermission('edit_inventory_item')) {
            abort(403, 'Unauthorized action.');
        }

        $item = $this->repo->findById($id);

        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->repo->update($id, $request->all());
        $updatedItem = $this->repo->findById($id);

        return response()->json($updatedItem);
    }

    public function incrementStock(Request $request, int $id)
    {
        $item = $this->repo->findById($id);

        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $quantity = (float) $request->input('quantity', 0);
        $this->repo->incrementStock($id, $quantity);
        $updatedItem = $this->repo->findById($id);

        return response()->json($updatedItem);
    }

    public function destroy(int $id)
    {
        $item = $this->repo->findById($id);

        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->repo->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 204);
    }

    public function getLedger(Request $request, int $id)
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $ledger = $this->repo->getLedger($id, $startDate, $endDate);

        return response()->json($ledger);
    }
}
