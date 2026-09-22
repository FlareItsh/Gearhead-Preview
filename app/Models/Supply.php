<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supply extends Model
{
    use HasFactory;

    protected $table = 'supplies';

    protected $primaryKey = 'supply_id';

    protected $fillable = [
        'supply_name',
        'unit',
        'purchase_unit',
        'base_unit',
        'conversion_factor',
        'reorder_point',
        'supply_type',
        'quantity_stock',
    ];

    protected $casts = [
        'quantity_stock' => 'decimal:2',
        'conversion_factor' => 'decimal:2',
    ];

    public function supplyPurchaseDetails(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SupplyPurchaseDetail::class, 'supply_id', 'supply_id');
    }

    public function pulloutRequestDetails(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PulloutRequestDetail::class, 'supply_id', 'supply_id');
    }

    public function serviceRetails(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ServiceRetail::class, 'supply_id', 'supply_id');
    }
}
