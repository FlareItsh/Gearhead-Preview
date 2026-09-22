<?php

use App\Models\Bay;
use App\Models\Employee;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

test('service order creation is idempotent', function () {
    // Setup
    $admin = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);
    $this->actingAs($admin);

    $user = User::factory()->create();
    $employee = Employee::factory()->create();
    $bay = Bay::create(['bay_number' => 1, 'status' => 'available', 'bay_type' => 'regular']);

    $service = Service::create([
        'service_name' => 'Test Service',
        'description' => 'Test Description',
        'category' => 'Test Category',
        'status' => 'active',
    ]);

    $variant = ServiceVariant::create([
        'service_id' => $service->service_id,
        'size' => 'Small',
        'price' => 500,
        'estimated_duration' => 60,
    ]);

    $idempotencyKey = Str::uuid()->toString();

    $payload = [
        'customer_id' => $user->user_id,
        'bay_id' => $bay->bay_id,
        'variant_ids' => [$variant->service_variant],
        'employee_id' => $employee->employee_id,
        'idempotency_key' => $idempotencyKey,
    ];

    // First Request
    $response1 = $this->postJson('/api/service-orders/registry', $payload);
    $response1->assertStatus(201);

    // Validate database state after first request
    $this->assertDatabaseCount('service_orders', 1);
    $order1 = $response1->json('order');

    // Second Request (Duplicate)
    $response2 = $this->postJson('/api/service-orders/registry', $payload);

    // Assertions for duplicate request
    $response2->assertStatus(200); // Should be 200 OK, not 201 Created
    $response2->assertJson(['message' => 'Service order already created']);

    $order2 = $response2->json('order');

    // Ensure it returned the SAME order
    expect($order2['service_order_id'])->toBe($order1['service_order_id']);

    // Final database check - still only 1 record
    $this->assertDatabaseCount('service_orders', 1);
});
