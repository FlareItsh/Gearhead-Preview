<?php

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

it('returns active employees regardless of assigned status', function () {
    // Create an employee who is active but "assigned" (busy)
    $employee = Employee::factory()->create([
        'status' => 'active',
        'assigned_status' => 'assigned',
        'first_name' => 'Busy',
        'last_name' => 'Bee',
    ]);

    // Create an employee who is active and "available"
    $employee2 = Employee::factory()->create([
        'status' => 'active',
        'assigned_status' => 'available',
        'first_name' => 'Free',
        'last_name' => 'Bird',
    ]);

    // Create an inactive employee
    $employee3 = Employee::factory()->create([
        'status' => 'inactive',
        'assigned_status' => 'available',
        'first_name' => 'Gone',
        'last_name' => 'Girl',
    ]);

    $response = $this->actingAs($this->admin)
        ->getJson('/api/employees/active-available');

    $response->assertStatus(200);

    // Both active employees should be present
    $response->assertJsonFragment(['employee_id' => $employee->employee_id]);
    $response->assertJsonFragment(['employee_id' => $employee2->employee_id]);

    // Inactive employee should NOT be present
    $response->assertJsonMissing(['employee_id' => $employee3->employee_id]);
});
