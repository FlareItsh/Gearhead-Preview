<?php

use App\Models\Employee;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderDetail;
use App\Models\ServiceVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create([
        'role' => 'admin',
        'permissions' => ['manage_payouts'],
    ]);
});

it('can store an employee with commission percentage', function () {
    $data = [
        'firstName' => 'John',
        'lastName' => 'Doe',
        'middleName' => 'M',
        'phone' => '09123456789',
        'address' => '123 Street',
        'commissionPercentage' => 15.5,
    ];

    $response = $this->actingAs($this->admin)
        ->postJson('/api/staffs', $data);

    $response->assertSuccessful();

    $this->assertDatabaseHas('employees', [
        'first_name' => 'John',
        'commission_percentage' => 15.5,
    ]);
});

it('can update an employee commission percentage', function () {
    $employee = Employee::factory()->create([
        'commission_percentage' => 10.0,
    ]);

    $data = [
        'firstName' => $employee->first_name,
        'lastName' => $employee->last_name,
        'phone' => $employee->phone_number,
        'address' => $employee->address,
        'status' => 'Active',
        'commissionPercentage' => 20.0,
    ];

    $response = $this->actingAs($this->admin)
        ->putJson("/staffs/{$employee->employee_id}", $data);

    $response->assertSuccessful();

    $this->assertDatabaseHas('employees', [
        'employee_id' => $employee->employee_id,
        'commission_percentage' => 20.0,
    ]);
});

it('calculates commissions correctly for completed orders', function () {
    $employee = Employee::factory()->create([
        'commission_percentage' => 10.0,
    ]);

    // Create a customer
    $customer = User::factory()->create(['role' => 'customer']);

    // Create a service variant with price 1000
    $variant = ServiceVariant::factory()->create(['price' => 1000]);

    // Create a completed service order for this employee
    $order = ServiceOrder::factory()->create([
        'employee_id' => $employee->employee_id,
        'user_id' => $customer->user_id,
        'status' => 'completed',
    ]);

    // Add detail: 2 units of variant (Total = 2000)
    ServiceOrderDetail::create([
        'service_order_id' => $order->service_order_id,
        'service_variant' => $variant->service_variant,
        'quantity' => 2,
    ]);

    // Fetch commissions
    $response = $this->actingAs($this->admin)
        ->getJson("/api/staffs/{$employee->employee_id}/commissions");

    $response->assertSuccessful();

    // Total = 2000, 10% = 200
    $response->assertJsonPath('total_commission', 200);
    $response->assertJsonFragment([
        'total_amount' => 2000,
        'commission_amount' => 200,
    ]);
});

it('can record a payout and identifies the processor', function () {
    $employee = Employee::factory()->create([
        'commission_percentage' => 50.0,
    ]);
    $variant = ServiceVariant::factory()->create(['price' => 1000]);
    $order = ServiceOrder::factory()->create([
        'employee_id' => $employee->employee_id,
        'status' => 'completed',
    ]);

    ServiceOrderDetail::create([
        'service_order_id' => $order->service_order_id,
        'service_variant' => $variant->service_variant,
        'quantity' => 1,
    ]);

    $data = [
        'amount' => 500.00,
        'payout_date' => now()->format('Y-m-d'),
        'remarks' => 'Test payout',
    ];

    $response = $this->actingAs($this->admin)
        ->postJson("/api/staffs/{$employee->employee_id}/payout", $data);

    $response->assertSuccessful();

    $this->assertDatabaseHas('staff_payouts', [
        'employee_id' => $employee->employee_id,
        'amount' => 500.00,
        'processed_by' => $this->admin->user_id,
    ]);
});

it('includes processor details in the wallet response', function () {
    $employee = Employee::factory()->create();

    // Create a payout processed by admin
    \App\Models\StaffPayout::create([
        'employee_id' => $employee->employee_id,
        'amount' => 300,
        'payout_date' => now(),
        'processed_by' => $this->admin->user_id,
    ]);

    $response = $this->actingAs($this->admin)
        ->getJson("/api/staffs/{$employee->employee_id}/wallet");

    $response->assertSuccessful();

    $response->assertJsonStructure([
        'payouts' => [
            '*' => [
                'processor' => ['user_id', 'first_name', 'last_name'],
            ],
        ],
    ]);

    $response->assertJsonFragment([
        'first_name' => $this->admin->first_name,
        'last_name' => $this->admin->last_name,
    ]);
});

it('returns a unified financial ledger response', function () {
    $employee = Employee::factory()->create([
        'commission_percentage' => 10.0,
    ]);
    $customer = User::factory()->create(['role' => 'customer']);
    $variant = ServiceVariant::factory()->create(['price' => 1000]);
    $order = ServiceOrder::factory()->create([
        'employee_id' => $employee->employee_id,
        'user_id' => $customer->user_id,
        'status' => 'completed',
    ]);

    ServiceOrderDetail::create([
        'service_order_id' => $order->service_order_id,
        'service_variant' => $variant->service_variant,
        'quantity' => 2,
    ]);

    \App\Models\StaffPayout::create([
        'employee_id' => $employee->employee_id,
        'amount' => 50,
        'payout_date' => now(),
        'processed_by' => $this->admin->user_id,
    ]);

    $response = $this->actingAs($this->admin)
        ->getJson("/api/staffs/{$employee->employee_id}/financial-ledger");

    $response->assertSuccessful()
        ->assertJsonPath('total_earned', 200)
        ->assertJsonPath('total_paid', 50)
        ->assertJsonPath('balance', 150)
        ->assertJsonPath('total_commission', 200)
        ->assertJsonStructure([
            'orders' => [
                '*' => ['id', 'date', 'customer', 'services', 'total_amount', 'commission_amount'],
            ],
            'payouts' => [
                '*' => ['payout_id', 'processor'],
            ],
        ]);
});

it('records batch payouts atomically', function () {
    $firstEmployee = Employee::factory()->create(['commission_percentage' => 10.0]);
    $secondEmployee = Employee::factory()->create(['commission_percentage' => 20.0]);
    $variant = ServiceVariant::factory()->create(['price' => 1000]);

    foreach ([$firstEmployee, $secondEmployee] as $employee) {
        $order = ServiceOrder::factory()->create([
            'employee_id' => $employee->employee_id,
            'status' => 'completed',
        ]);

        ServiceOrderDetail::create([
            'service_order_id' => $order->service_order_id,
            'service_variant' => $variant->service_variant,
            'quantity' => 1,
        ]);
    }

    $response = $this->actingAs($this->admin)
        ->postJson('/api/staffs/batch-payout', [
            'payout_date' => now()->format('Y-m-d'),
            'remarks' => 'Weekly settlement',
            'payouts' => [
                ['employee_id' => $firstEmployee->employee_id, 'amount' => 100],
                ['employee_id' => $secondEmployee->employee_id, 'amount' => 200],
            ],
        ]);

    $response->assertSuccessful();

    $this->assertDatabaseHas('staff_payouts', [
        'employee_id' => $firstEmployee->employee_id,
        'amount' => 100,
        'remarks' => 'Weekly settlement',
        'processed_by' => $this->admin->user_id,
    ]);
    $this->assertDatabaseHas('staff_payouts', [
        'employee_id' => $secondEmployee->employee_id,
        'amount' => 200,
        'remarks' => 'Weekly settlement',
        'processed_by' => $this->admin->user_id,
    ]);
});

it('rolls back a batch payout when one payout exceeds balance', function () {
    $firstEmployee = Employee::factory()->create(['commission_percentage' => 10.0]);
    $secondEmployee = Employee::factory()->create(['commission_percentage' => 10.0]);
    $variant = ServiceVariant::factory()->create(['price' => 1000]);

    foreach ([$firstEmployee, $secondEmployee] as $employee) {
        $order = ServiceOrder::factory()->create([
            'employee_id' => $employee->employee_id,
            'status' => 'completed',
        ]);

        ServiceOrderDetail::create([
            'service_order_id' => $order->service_order_id,
            'service_variant' => $variant->service_variant,
            'quantity' => 1,
        ]);
    }

    $response = $this->actingAs($this->admin)
        ->postJson('/api/staffs/batch-payout', [
            'payout_date' => now()->format('Y-m-d'),
            'payouts' => [
                ['employee_id' => $firstEmployee->employee_id, 'amount' => 50],
                ['employee_id' => $secondEmployee->employee_id, 'amount' => 150],
            ],
        ]);

    $response->assertUnprocessable();

    $this->assertDatabaseMissing('staff_payouts', [
        'employee_id' => $firstEmployee->employee_id,
        'amount' => 50,
    ]);
});
