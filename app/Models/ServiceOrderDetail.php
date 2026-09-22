<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceOrderDetail extends Model
{
    use HasFactory;

    protected $table = 'service_order_details';

    protected $primaryKey = 'service_order_detail_id';

    protected $fillable = [
        'service_order_id',
        'service_variant',
        'quantity',
    ];

    public function serviceOrder(): BelongsTo
    {
        return $this->belongsTo(ServiceOrder::class, 'service_order_id', 'service_order_id');
    }

    public function serviceVariant(): BelongsTo
    {
        return $this->belongsTo(ServiceVariant::class, 'service_variant', 'service_variant');
    }

    public function pulloutServices(): HasMany
    {
        return $this->hasMany(PulloutService::class, 'service_order_detail_id', 'service_order_detail_id');
    }
}
