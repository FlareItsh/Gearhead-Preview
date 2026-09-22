<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PulloutRequest extends Model
{
    use HasFactory;

    protected $table = 'pullout_requests';

    protected $primaryKey = 'pullout_request_id';

    protected $fillable = [
        'employee_id',
        'date_time',
        'approve_by',
        'approve_date',
        'is_approve',
    ];

    protected $casts = [
        'date_time' => 'datetime',
        'approve_date' => 'datetime',
        'is_approve' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function details()
    {
        return $this->hasMany(PulloutRequestDetail::class, 'pullout_request_id', 'pullout_request_id');
    }
}
