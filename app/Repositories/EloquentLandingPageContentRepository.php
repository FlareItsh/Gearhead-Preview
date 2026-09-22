<?php

namespace App\Repositories;

use App\Models\LandingPageContent;
use App\Repositories\Contracts\LandingPageContentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class EloquentLandingPageContentRepository implements LandingPageContentRepositoryInterface
{
    public function all(): Collection
    {
        return LandingPageContent::all();
    }

    public function findById(int $id): ?LandingPageContent
    {
        return LandingPageContent::find($id);
    }

    public function create(array $data): LandingPageContent
    {
        return LandingPageContent::create($data);
    }

    public function update(LandingPageContent $content, array $data): bool
    {
        return $content->update($data);
    }

    public function delete(LandingPageContent $content): bool
    {
        return $content->delete();
    }
}
