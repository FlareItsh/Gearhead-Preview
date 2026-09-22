<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\SupplierRepositoryInterface;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    protected SupplierRepositoryInterface $repo;

    public function __construct(SupplierRepositoryInterface $repo)
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
        if (! $request->user() || ! $request->user()->hasPermission('add_inventory_supplier')) {
            abort(403, 'Unauthorized action.');
        }

        $created = $this->repo->create($request->all());

        return response()->json($created, 201);
    }

    public function update(Request $request, int $id)
    {
        if (! $request->user() || ! $request->user()->hasPermission('add_inventory_supplier')) {
            abort(403, 'Unauthorized action.');
        }

        $item = $this->repo->findById($id);
        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->repo->update($item, $request->all());

        return response()->json($item);
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
}
