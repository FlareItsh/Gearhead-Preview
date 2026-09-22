<?php

use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

it('can search employees by first name', function () {
    Employee::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
    Employee::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);

    $response = $this->actingAs($this->admin)
        ->getJson('/api/employees/list?search=John');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.first_name', 'John');
});

it('can search employees by last name', function () {
    Employee::factory()->create(['first_name' => 'John', 'last_name' => 'Doe']);
    Employee::factory()->create(['first_name' => 'Jane', 'last_name' => 'Smith']);

    $response = $this->actingAs($this->admin)
        ->getJson('/api/employees/list?search=Smith');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.last_name', 'Smith');
});

it('can search employees by phone number', function () {
    Employee::factory()->create(['first_name' => 'John', 'phone_number' => '09123456789']);
    Employee::factory()->create(['first_name' => 'Jane', 'phone_number' => '09987654321']);

    $response = $this->actingAs($this->admin)
        ->getJson('/api/employees/list?search=09123456789');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.first_name', 'John');
});

it('can filter employees by status', function () {
    Employee::factory()->create(['first_name' => 'Active', 'status' => 'active']);
    Employee::factory()->create(['first_name' => 'Inactive', 'status' => 'inactive']);
    Employee::factory()->create(['first_name' => 'Absent', 'status' => 'absent']);

    // Filter for active (case sensitive depends on repository logic, repository uses ucfirst in response but raw values from query)
    $response = $this->actingAs($this->admin)
        ->getJson('/api/employees/list?status=active');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.first_name', 'Active');

    // Filter for inactive
    $response = $this->actingAs($this->admin)
        ->getJson('/api/employees/list?status=inactive');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.first_name', 'Inactive');
});

it('does not fail when searching with missing email column', function () {
    Employee::factory()->create(['first_name' => 'Test', 'last_name' => 'User']);

    $response = $this->actingAs($this->admin)
        ->getJson('/api/employees/list?search=Test');

    $response->assertStatus(200);
});
