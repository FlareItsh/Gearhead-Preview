<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceVariant extends Model
{
    use HasFactory;

    protected $table = 'service_variants';

    protected $primaryKey = 'service_variant';

    protected $fillable = [
        'service_id',
        'size',
        'price',
        'estimated_duration',
    ];

    protected $casts = [
        'estimated_duration' => 'integer',
        'price' => 'float',
    ];

    protected $appends = [
        'service_name',
        'description',
        'category',
        'status',
    ];

    public function getServiceNameAttribute(): string
    {
        return $this->service?->service_name ?? '';
    }

    public function getDescriptionAttribute(): string
    {
        return $this->service?->description ?? '';
    }

    public function getCategoryAttribute(): string
    {
        return $this->service?->category ?? '';
    }

    public function getStatusAttribute(): string
    {
        return $this->service?->status ?? 'active';
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_id', 'service_id');
    }

    public function serviceOrderDetails(): HasMany
    {
        return $this->hasMany(ServiceOrderDetail::class, 'service_variant', 'service_variant');
    }

    public function serviceRetails(): HasMany
    {
        return $this->hasMany(ServiceRetail::class, 'service_variant_id', 'service_variant');
    }
}
