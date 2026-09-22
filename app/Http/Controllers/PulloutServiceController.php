<?php

namespace App\Http\Controllers;

use App\Repositories\Contracts\PulloutServiceRepositoryInterface;
use Illuminate\Http\Request;

class PulloutServiceController extends Controller
{
    protected PulloutServiceRepositoryInterface $pulloutServiceRepository;

    public function __construct(PulloutServiceRepositoryInterface $pulloutServiceRepository)
    {
        $this->pulloutServiceRepository = $pulloutServiceRepository;
    }

    public function index()
    {
        $pulloutServices = $this->pulloutServiceRepository->getAllWithDetails();

        return response()->json($pulloutServices);
    }

    public function show(int $id)
    {
        $item = $this->pulloutServiceRepository->findById($id);

        return $item ? response()->json($item) : response()->json(['message' => 'Not found'], 404);
    }

    public function store(Request $request)
    {
        $created = $this->pulloutServiceRepository->create($request->all());

        return response()->json($created, 201);
    }

    public function update(Request $request, int $id)
    {
        $item = $this->pulloutServiceRepository->findById($id);
        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->pulloutServiceRepository->update($item, $request->all());

        return response()->json($item);
    }

    public function destroy(int $id)
    {
        $item = $this->pulloutServiceRepository->findById($id);
        if (! $item) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $this->pulloutServiceRepository->delete($item);

        return response()->json(null, 204);
    }
}
