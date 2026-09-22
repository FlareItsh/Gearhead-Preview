<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRetail extends Model
{
    use HasFactory;

    protected $table = 'service_retails';

    protected $fillable = [
        'service_variant_id',
        'supply_id',
        'quantity_needed',
    ];

    protected $casts = [
        'quantity_needed' => 'decimal:2',
    ];

    public function serviceVariant(): BelongsTo
    {
        return $this->belongsTo(ServiceVariant::class, 'service_variant_id', 'service_variant');
    }

    public function supply(): BelongsTo
    {
        return $this->belongsTo(Supply::class, 'supply_id', 'supply_id');
    }
}
