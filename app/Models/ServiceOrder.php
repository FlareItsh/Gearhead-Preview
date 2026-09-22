<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceOrder extends Model
{
    use HasFactory;

    protected $table = 'service_orders';

    protected $primaryKey = 'service_order_id';

    protected $fillable = [
        'user_id',
        'employee_id',
        'bay_id',
        'status',
        'order_date',
        'order_type',
        'idempotency_key',
        'car_id',
        'vehicle_make',
        'vehicle_model',
        'vehicle_size',
    ];

    protected $casts = [
        'order_date' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function bay()
    {
        return $this->belongsTo(Bay::class, 'bay_id', 'bay_id');
    }

    public function car()
    {
        return $this->belongsTo(Car::class, 'car_id', 'car_id');
    }

    public function details()
    {
        return $this->hasMany(ServiceOrderDetail::class, 'service_order_id', 'service_order_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'service_order_id', 'service_order_id');
    }

    public function queueLine()
    {
        return $this->hasOne(QueueLine::class, 'service_order_id', 'service_order_id');
    }
}
