<?php

namespace App\Repositories\Contracts;

use App\Models\Employee;
use Illuminate\Support\Collection;

interface EmployeeRepositoryInterface
{
    /**
     * Get all employees.
     *
     * @return Collection<Employee>
     */
    public function all(): Collection;

    /**
     * Get paginated employees with filters.
     */
    public function getPaginatedEmployees(int $perPage, ?string $search = null, ?string $status = null);

    /**
     * Find an employee by ID.
     */
    public function find(int $id): Employee;

    /**
     * Create a new employee.
     */
    public function create(array $data): Employee;

    /**
     * Update an existing employee.
     */
    public function update(int $id, array $data): Employee;

    /**
     * Delete an employee by ID.
     */
    public function delete(int $id): bool;

    /**
     * Count employees with 'active' status.
     */
    public function countActiveEmployees(): int;

    /**
     * Get all active employees.
     *
     * @return Collection<Employee>
     */
    public function findActive(): Collection;

    /**
     * Update employee assigned status.
     */
    public function updateAssignedStatus(int $id, string $status): bool;
}
