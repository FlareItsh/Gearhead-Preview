<?php

namespace App\Models;

use App\Traits\HasFullName;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory, HasFullName;

    /**
     * The table associated with the model.
     */
    protected $table = 'employees';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'employee_id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'phone_number',
        'address',
        'status',
        'assigned_status',
        'commission_percentage',
        'date_hired',
        'employment_ended_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'date_hired' => 'date',
        'employment_ended_at' => 'datetime',
    ];

    /**
     * Accessor: Get the employee's full name (includes middle name).
     */
    public function getFullNameAttribute(): string
    {
        $middle = $this->middle_name ? ' '.$this->middle_name : '';

        return "{$this->first_name}{$middle} {$this->last_name}";
    }

    /**
     * Accessor: Get the employee's name (without middle name).
     */
    public function getNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Scope: Only active employees.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: Only inactive employees.
     */
    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    /**
     * Scope: Only absent employees.
     */
    public function scopeAbsent($query)
    {
        return $query->where('status', 'absent');
    }

    /**
     * Mark the employee as inactive and set employment_ended_at.
     */
    public function markAsInactive(): void
    {
        $this->update([
            'status' => 'inactive',
            'employment_ended_at' => Carbon::now(),
        ]);
    }

    /**
     * Reactivate an employee.
     */
    public function reactivate(): void
    {
        $this->update([
            'status' => 'active',
            'employment_ended_at' => null,
        ]);
    }

    /**
     * Relationship: Payouts for this employee.
     */
    public function payouts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StaffPayout::class, 'employee_id', 'employee_id');
    }

    /**
     * Relationship: Completed service orders where this employee was assigned.
     */
    public function completedServiceOrders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ServiceOrder::class, 'employee_id', 'employee_id')
            ->where('status', 'completed');
    }
}
