<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bay extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'bays';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'bay_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'bay_number',
        'bay_type',
        'status',
    ];

    public static function add(array $data): Bay
    {
        return self::create($data);
    }

    /**
     * Update an existing bay by ID.
     */
    public static function updateBay(int $id, array $data): ?Bay
    {
        $bay = self::find($id);
        if ($bay) {
            $bay->update($data);
        }

        return $bay;
    }

    /**
     * Delete a bay by ID.
     */
    public static function deleteBay(int $id): bool
    {
        $bay = self::find($id);

        return $bay ? $bay->delete() : false;
    }

    /**
     * Change the bay status.
     */
    public static function setStatus(int $id, string $status): ?Bay
    {
        $bay = self::find($id);
        if ($bay) {
            $bay->update(['status' => $status]);
        }

        return $bay;
    }

    /**
     * Get all bays.
     */
    public static function allBays(): Collection
    {
        return self::all();
    }
}
