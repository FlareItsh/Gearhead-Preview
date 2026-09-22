<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PulloutService extends Model
{
    use HasFactory;

    protected $table = 'pullout_services';

    protected $primaryKey = 'pullout_service_id';

    protected $fillable = [
        'service_order_detail_id',
        'bay_number',
    ];

    public function serviceOrderDetail()
    {
        return $this->belongsTo(ServiceOrderDetail::class, 'service_order_detail_id', 'service_order_detail_id');
    }

    public function pulloutRequestDetails()
    {
        return $this->hasMany(PulloutRequestDetail::class, 'pullout_service_id', 'pullout_service_id');
    }
}
