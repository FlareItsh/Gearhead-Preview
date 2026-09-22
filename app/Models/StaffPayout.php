<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffPayout extends Model
{
    protected $table = 'staff_payouts';

    protected $primaryKey = 'payout_id';

    protected $fillable = [
        'employee_id',
        'amount',
        'payout_date',
        'remarks',
        'processed_by',
    ];

    protected $casts = [
        'payout_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by', 'user_id');
    }
}
