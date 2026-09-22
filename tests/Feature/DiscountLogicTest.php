<?php

use App\Models\Bay;
use App\Models\Discount;
use App\Models\Employee;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

it('rejects percentage discounts greater than 100', function () {
    $response = $this->actingAs($this->admin)
        ->from(route('admin.moderation'))
        ->post(route('admin.moderation.discounts.store'), [
            'name' => 'Invalid Discount',
            'type' => 'percentage',
            'value' => 101,
            'valid_from' => '',
            'valid_to' => '',
            'is_active' => true,
        ]);

    $response->assertSessionHasErrors('value');
});

it('caps percentage reduction at 100% in model logic', function () {
    $discount = Discount::create([
        'name' => '1000% Discount',
        'type' => 'percentage',
        'value' => 1000,
        'is_active' => true,
    ]);

    $total = 100.00;
    $reduction = $discount->calculateReduction($total);

    expect($reduction)->toBe(100.00);
});

it('caps fixed reduction at total amount in model logic', function () {
    $discount = Discount::create([
        'name' => 'Over-the-top Discount',
        'type' => 'fixed',
        'value' => 500,
        'is_active' => true,
    ]);

    $total = 100.00;
    $reduction = $discount->calculateReduction($total);

    expect($reduction)->toBe(100.00);
});

it('ensures payment process results in non-negative total', function () {
    // We need a real service order to process payment
    $customer = User::factory()->create(['role' => 'customer']);
    $bay = Bay::factory()->create(['status' => 'occupied']);
    $employee = Employee::factory()->create(['status' => 'active', 'assigned_status' => 'assigned']);

    $order = ServiceOrder::create([
        'user_id' => $customer->user_id,
        'bay_id' => $bay->bay_id,
        'employee_id' => $employee->employee_id,
        'status' => 'in_progress',
        'order_date' => now(),
        'order_type' => 'W',
    ]);

    // Create a discount that's larger than the payment amount
    Discount::create([
        'name' => 'Huge Discount',
        'type' => 'fixed',
        'value' => 1000,
        'is_active' => true,
        'valid_from' => now()->subDay(),
    ]);

    $response = $this->actingAs($this->admin)
        ->postJson(route('payment.process'), [
            'service_order_id' => $order->service_order_id,
            'bay_id' => $bay->bay_id,
            'payment_method' => 'cash',
            'amount' => 500, // Should be reduced to 0 by the 1000 fixed discount
        ]);

    $response->assertStatus(201);
    $data = $response->json();

    expect((float) $data['payment']['amount'])->toBe(0.0);
});
