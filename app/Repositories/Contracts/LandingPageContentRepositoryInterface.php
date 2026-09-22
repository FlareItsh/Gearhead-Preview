<?php

namespace App\Repositories\Contracts;

use App\Models\LandingPageContent;
use Illuminate\Database\Eloquent\Collection;

interface LandingPageContentRepositoryInterface
{
    public function all(): Collection;

    public function findById(int $id): ?LandingPageContent;

    public function create(array $data): LandingPageContent;

    public function update(LandingPageContent $content, array $data): bool;

    public function delete(LandingPageContent $content): bool;
}
