<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QueueLine extends Model
{
    protected $table = 'queue_lines';

    protected $primaryKey = 'queue_line_id';

    protected $fillable = [
        'service_order_id',
        'status',
    ];

    public function serviceOrder()
    {
        return $this->belongsTo(ServiceOrder::class, 'service_order_id', 'service_order_id');
    }
}
