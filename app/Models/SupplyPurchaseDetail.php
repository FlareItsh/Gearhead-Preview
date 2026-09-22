<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplyPurchaseDetail extends Model
{
    use HasFactory;

    protected $table = 'supply_purchase_details';

    protected $primaryKey = 'supply_purchase_details_id';

    protected $fillable = [
        'supply_purchase_id',
        'supply_id',
        'quantity',
        'conversion_factor',
        'quantity_base',
        'unit_price',
        'purchase_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'conversion_factor' => 'decimal:2',
        'quantity_base' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'purchase_date' => 'datetime',
    ];

    public function supply(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Supply::class, 'supply_id', 'supply_id');
    }

    public function supplyPurchase(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(SupplyPurchase::class, 'supply_purchase_id', 'supply_purchase_id');
    }
}
