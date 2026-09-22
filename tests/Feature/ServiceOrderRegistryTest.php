<?php

use App\Models\Bay;
use App\Models\Employee;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->customer = User::factory()->create(['role' => 'customer']);
    $this->bay = Bay::factory()->create(['status' => 'available']);
    $this->employee = Employee::factory()->create(['status' => 'active', 'assigned_status' => 'available']);

    $this->service = Service::create([
        'service_name' => 'Carwash',
        'description' => 'Standard carwash',
        'category' => 'Wash',
        'status' => 'active',
    ]);

    $this->variant = ServiceVariant::create([
        'service_id' => $this->service->service_id,
        'size' => 'Small',
        'price' => 250.00,
        'estimated_duration' => 30,
    ]);
});

it('can create a service order from registry with variants', function () {
    $response = $this->actingAs($this->admin)
        ->postJson('/api/service-orders/registry', [
            'customer_id' => $this->customer->user_id,
            'bay_id' => $this->bay->bay_id,
            'variant_ids' => [$this->variant->service_variant],
            'employee_id' => $this->employee->employee_id,
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('service_orders', [
        'user_id' => $this->customer->user_id,
        'bay_id' => $this->bay->bay_id,
        'status' => 'in_progress',
    ]);

    $this->assertDatabaseHas('service_order_details', [
        'service_variant' => $this->variant->service_variant,
    ]);

    $this->assertEquals('occupied', $this->bay->fresh()->status);
    $this->assertEquals('assigned', $this->employee->fresh()->assigned_status);
});
