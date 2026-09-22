<?php

use App\Models\Bay;
use App\Models\Employee;
use App\Models\QueueLine;
use App\Models\ServiceOrder;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('queue line item is marked completed when payment is processed', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $bay = Bay::create([
        'bay_number' => '1',
        'status' => 'busy',
        'bay_type' => 'Standard',
    ]);
    $employee = Employee::factory()->create(['status' => 'active', 'assigned_status' => 'assigned']);
    $order = ServiceOrder::factory()->create([
        'user_id' => User::factory()->create()->user_id,
        'bay_id' => $bay->bay_id,
        'employee_id' => $employee->employee_id,
        'status' => 'in_progress',
        'order_date' => now(),
        'order_type' => 'W',
    ]);

    QueueLine::create([
        'service_order_id' => $order->service_order_id,
        'status' => 'waiting',
    ]);

    $response = $this->postJson('/api/payment/process', [
        'service_order_id' => $order->service_order_id,
        'bay_id' => $bay->bay_id,
        'payment_method' => 'cash',
        'amount' => 100,
    ]);

    $response->assertStatus(201);

    // Verify queue line is completed
    $this->assertDatabaseHas('queue_lines', [
        'service_order_id' => $order->service_order_id,
        'status' => 'completed',
    ]);

    // Verify it's no longer in active queues
    $activeResponse = $this->getJson('/api/queues/active');
    $activeResponse->assertStatus(200);
    $activeQueues = $activeResponse->json();

    $ids = array_column($activeQueues, 'service_order_id');
    expect($ids)->not->toContain($order->service_order_id);
});

test('queue line item is marked cancelled when booking is cancelled', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Sanctum::actingAs($admin);

    $customer = User::factory()->create(['role' => 'customer']);

    $order = ServiceOrder::factory()->create([
        'user_id' => $customer->user_id,
        'status' => 'pending',
        'order_date' => now(),
        'order_type' => 'R',
    ]);

    $queue = QueueLine::create([
        'service_order_id' => $order->service_order_id,
        'status' => 'waiting',
    ]);

    // Force acting as the customer to own the booking for cancellation
    Sanctum::actingAs($customer);

    $response = $this->postJson("/api/bookings/cancel/{$order->service_order_id}");

    // The endpoint returns a redirect (back())
    $response->assertStatus(302);

    // Verify queue line is cancelled
    $this->assertDatabaseHas('queue_lines', [
        'service_order_id' => $order->service_order_id,
        'status' => 'cancelled',
    ]);

    // Verify it's no longer in active queues
    Sanctum::actingAs($admin);
    $activeResponse = $this->getJson('/api/queues/active');
    $activeResponse->assertStatus(200);
    $activeQueues = $activeResponse->json();

    $ids = array_column($activeQueues, 'service_order_id');
    expect($ids)->not->toContain($order->service_order_id);
});
