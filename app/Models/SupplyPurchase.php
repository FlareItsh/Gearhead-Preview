<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplyPurchase extends Model
{
    use HasFactory;

    protected $table = 'supply_purchases';

    protected $primaryKey = 'supply_purchase_id';

    protected $fillable = [
        'supplier_id',
        'purchase_date',
        'purchase_reference',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function details()
    {
        return $this->hasMany(SupplyPurchaseDetail::class, 'supply_purchase_id', 'supply_purchase_id');
    }
}
