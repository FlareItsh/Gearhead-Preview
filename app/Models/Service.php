<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $table = 'services';

    protected $primaryKey = 'service_id';

    protected $fillable = [
        'service_name',
        'description',
        'category',
        'status',
    ];

    public function variants(): HasMany
    {
        return $this->hasMany(ServiceVariant::class, 'service_id', 'service_id');
    }

    public function discounts()
    {
        return $this->belongsToMany(Discount::class, 'discount_service', 'service_id', 'discount_id');
    }
}
