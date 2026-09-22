<?php

namespace App\Repositories;

use App\Models\Employee;
use App\Repositories\Contracts\EmployeeRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentEmployeeRepository implements EmployeeRepositoryInterface
{
    public function all(): Collection
    {
        return Employee::orderBy('first_name')->get();
    }

    public function getPaginatedEmployees(int $perPage, ?string $search = null, ?string $status = null)
    {
        $query = Employee::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->orderBy('first_name')->paginate($perPage)
            ->through(function ($employee) {
                return [
                    'employee_id' => $employee->employee_id,
                    'first_name' => $employee->first_name,
                    'last_name' => $employee->last_name,
                    'middle_name' => $employee->middle_name,
                    'phone_number' => $employee->phone_number,
                    'address' => $employee->address,
                    'status' => ucfirst($employee->status),
                    'date_hired' => optional($employee->date_hired)->format('Y-m-d'),
                    'role' => $employee->role ?? 'Employee',
                    'assigned_status' => $employee->assigned_status,
                    'commission_percentage' => (float) $employee->commission_percentage,
                    'created_at' => $employee->created_at,
                    'updated_at' => $employee->updated_at,
                ];
            });
    }

    public function find(int $id): Employee
    {
        return Employee::findOrFail($id);
    }

    public function create(array $data): Employee
    {
        return Employee::create($data);
    }

    public function update(int $id, array $data): Employee
    {
        $employee = Employee::findOrFail($id);
        $employee->update($data);

        return $employee;
    }

    public function delete(int $id): bool
    {
        $employee = Employee::findOrFail($id);

        return $employee->delete();
    }

    public function countActiveEmployees(): int
    {
        return Employee::where('status', 'active')->count();
    }

    public function findActive(): Collection
    {
        return Employee::where('status', 'active')
            ->orderBy('first_name')
            ->get();
    }

    public function updateAssignedStatus(int $id, string $status): bool
    {
        $employee = Employee::findOrFail($id);

        return $employee->update(['assigned_status' => $status]);
    }
}
