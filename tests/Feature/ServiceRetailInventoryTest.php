<?php

use App\Models\Bay;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderDetail;
use App\Models\ServiceRetail;
use App\Models\ServiceVariant;
use App\Models\Supply;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function actingServiceRetailAdmin(): User
{
    $admin = User::factory()->create([
        'role' => 'admin',
        'permissions' => ['edit_service'],
    ]);

    Sanctum::actingAs($admin);

    return $admin;
}

function createServiceRetailVariant(string $size = 'Small'): ServiceVariant
{
    $service = Service::create([
        'service_name' => fake()->unique()->words(3, true),
        'description' => 'Exterior wash',
        'category' => 'Wash',
        'status' => 'active',
    ]);

    return ServiceVariant::create([
        'service_id' => $service->service_id,
        'size' => $size,
        'price' => 250,
        'estimated_duration' => 30,
    ]);
}

function createServiceRetailSupply(string $name, float $stock, float $conversionFactor = 100): Supply
{
    return Supply::create([
        'supply_name' => $name,
        'unit' => 'Bottle',
        'purchase_unit' => 'Bottle',
        'base_unit' => 'ml',
        'conversion_factor' => $conversionFactor,
        'reorder_point' => 100,
        'supply_type' => 'consumables',
        'quantity_stock' => $stock,
    ]);
}

function createServiceRetailOrder(ServiceVariant $variant, int $quantity = 1): array
{
    $bay = Bay::create([
        'bay_number' => fake()->unique()->numerify('Bay-###'),
        'bay_type' => 'Standard',
        'status' => 'busy',
    ]);

    $order = ServiceOrder::create([
        'user_id' => User::factory()->create(['role' => 'customer'])->user_id,
        'bay_id' => $bay->bay_id,
        'status' => 'in_progress',
        'order_date' => now(),
        'order_type' => 'W',
    ]);

    ServiceOrderDetail::create([
        'service_order_id' => $order->service_order_id,
        'service_variant' => $variant->service_variant,
        'quantity' => $quantity,
    ]);

    return [$order, $bay];
}

it('saves a service retail recipe for a service variant', function () {
    actingServiceRetailAdmin();
    $variant = createServiceRetailVariant();
    $shampoo = createServiceRetailSupply('Car shampoo', 1000);
    $wax = createServiceRetailSupply('Wax', 1000);

    $response = $this->postJson("/api/services/variants/{$variant->service_variant}/retails", [
        'retails' => [
            ['supply_id' => $shampoo->supply_id, 'quantity_needed' => 25],
            ['supply_id' => $wax->supply_id, 'quantity_needed' => 10],
        ],
    ]);

    $response->assertSuccessful();

    $this->assertDatabaseHas('service_retails', [
        'service_variant_id' => $variant->service_variant,
        'supply_id' => $shampoo->supply_id,
        'quantity_needed' => 25,
    ]);
    $this->assertDatabaseHas('service_retails', [
        'service_variant_id' => $variant->service_variant,
        'supply_id' => $wax->supply_id,
        'quantity_needed' => 10,
    ]);
});

it('rejects duplicate supply rows in a service retail recipe', function () {
    actingServiceRetailAdmin();
    $variant = createServiceRetailVariant();
    $supply = createServiceRetailSupply('Degreaser', 1000);

    $response = $this->postJson("/api/services/variants/{$variant->service_variant}/retails", [
        'retails' => [
            ['supply_id' => $supply->supply_id, 'quantity_needed' => 25],
            ['supply_id' => $supply->supply_id, 'quantity_needed' => 15],
        ],
    ]);

    $response->assertUnprocessable();
    $this->assertDatabaseMissing('service_retails', [
        'service_variant_id' => $variant->service_variant,
        'supply_id' => $supply->supply_id,
    ]);
});

it('converts recipe base units to stock units when payment completes', function () {
    actingServiceRetailAdmin();
    $variant = createServiceRetailVariant();
    $shampoo = createServiceRetailSupply('Foam shampoo', 53, 100);
    $wax = createServiceRetailSupply('Spray wax', 10, 200);

    ServiceRetail::create([
        'service_variant_id' => $variant->service_variant,
        'supply_id' => $shampoo->supply_id,
        'quantity_needed' => 50,
    ]);
    ServiceRetail::create([
        'service_variant_id' => $variant->service_variant,
        'supply_id' => $wax->supply_id,
        'quantity_needed' => 20,
    ]);

    [$order, $bay] = createServiceRetailOrder($variant, 2);

    $response = $this->postJson('/api/payment/process', [
        'service_order_id' => $order->service_order_id,
        'bay_id' => $bay->bay_id,
        'payment_method' => 'cash',
        'amount' => 500,
    ]);

    $response->assertCreated();

    expect((float) $shampoo->fresh()->quantity_stock)->toBe(52.0)
        ->and((float) $wax->fresh()->quantity_stock)->toBe(9.8);
});

it('blocks payment completion when recipe stock is insufficient', function () {
    actingServiceRetailAdmin();
    $variant = createServiceRetailVariant();
    $supply = createServiceRetailSupply('Glass cleaner', 0.4, 100);

    ServiceRetail::create([
        'service_variant_id' => $variant->service_variant,
        'supply_id' => $supply->supply_id,
        'quantity_needed' => 50,
    ]);

    [$order, $bay] = createServiceRetailOrder($variant, 1);

    $response = $this->postJson('/api/payment/process', [
        'service_order_id' => $order->service_order_id,
        'bay_id' => $bay->bay_id,
        'payment_method' => 'cash',
        'amount' => 250,
    ]);

    $response->assertUnprocessable();

    expect((float) $supply->fresh()->quantity_stock)->toBe(0.4)
        ->and($order->fresh()->status)->toBe('in_progress')
        ->and(Payment::where('service_order_id', $order->service_order_id)->exists())->toBeFalse();
});

it('does not double deduct stock when payment processing is repeated', function () {
    actingServiceRetailAdmin();
    $variant = createServiceRetailVariant();
    $supply = createServiceRetailSupply('Tire shine', 5, 100);

    ServiceRetail::create([
        'service_variant_id' => $variant->service_variant,
        'supply_id' => $supply->supply_id,
        'quantity_needed' => 25,
    ]);

    [$order, $bay] = createServiceRetailOrder($variant, 1);

    $payload = [
        'service_order_id' => $order->service_order_id,
        'bay_id' => $bay->bay_id,
        'payment_method' => 'cash',
        'amount' => 250,
    ];

    $this->postJson('/api/payment/process', $payload)->assertCreated();
    $stockAfterFirstPayment = (float) $supply->fresh()->quantity_stock;

    $this->postJson('/api/payment/process', $payload)->assertUnprocessable();

    expect((float) $supply->fresh()->quantity_stock)->toBe($stockAfterFirstPayment)
        ->and($stockAfterFirstPayment)->toBe(4.75);
});
