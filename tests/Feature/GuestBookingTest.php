<?php

use App\Models\Car;
use App\Models\Service;
use App\Models\ServiceVariant;
use App\Models\User;

test('guests can access services page', function () {
    $response = $this->get('/services');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page->component('Customer/Services'));
});

test('authenticated customers can access services page', function () {
    $user = User::factory()->create(['role' => 'customer']);

    $response = $this->actingAs($user)->get('/services');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page->component('Customer/Services'));
});

test('guest can book services with customer info', function () {
    // Create a service with variants
    $service = Service::factory()->create();
    $variant = ServiceVariant::factory()->create(['service_id' => $service->service_id]);

    $guestInfo = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'phone' => '09123456789',
        'vehicleModel' => 'Toyota Corolla 2020',
    ];

    $response = $this->postJson('/api/bookings/book', [
        'order_date' => now()->addHours(2)->format('Y-m-d H:i'),
        'variant_ids' => [$variant->service_variant],
        'guest_info' => $guestInfo,
    ]);

    $response->assertStatus(201);

    // Verify user was created
    $user = User::where('email', $guestInfo['email'])->first();
    expect($user)->not->toBeNull();
    expect($user->first_name)->toBe('John');
    expect($user->last_name)->toBe('Doe');
    expect($user->phone_number)->toBe('09123456789');
    expect($user->role)->toBe('customer');
});

test('authenticated user booking includes their info', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $service = Service::factory()->create();
    $variant = ServiceVariant::factory()->create(['service_id' => $service->service_id]);

    $response = $this->actingAs($user)->postJson('/api/bookings/book', [
        'order_date' => now()->addHours(2)->format('Y-m-d H:i'),
        'variant_ids' => [$variant->service_variant],
    ]);

    $response->assertStatus(201);
    expect($response->json('user_id'))->toBe($user->user_id);
});

test('guest booking reuses existing user by email', function () {
    $existingUser = User::factory()->create([
        'email' => 'existing@example.com',
        'role' => 'customer',
    ]);

    $service = Service::factory()->create();
    $variant = ServiceVariant::factory()->create(['service_id' => $service->service_id]);

    $response = $this->postJson('/api/bookings/book', [
        'order_date' => now()->addHours(2)->format('Y-m-d H:i'),
        'variant_ids' => [$variant->service_variant],
        'guest_info' => [
            'name' => 'Different Name',
            'email' => 'existing@example.com',
            'phone' => '09987654321',
        ],
    ]);

    $response->assertStatus(201);

    // Should use existing user, not create new one
    expect(User::where('email', 'existing@example.com')->count())->toBe(1);
    expect($response->json('user_id'))->toBe($existingUser->user_id);
});

test('booking requires at least one service', function () {
    $response = $this->postJson('/api/bookings/book', [
        'order_date' => now()->addHours(2)->format('Y-m-d H:i'),
        'variant_ids' => [],
        'guest_info' => [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '09123456789',
        ],
    ]);

    // Should fail validation before trying to authenticate
    expect([422, 401])->toContain($response->status());
});

test('booking respects business hours', function () {
    $service = Service::factory()->create();
    $variant = ServiceVariant::factory()->create(['service_id' => $service->service_id]);

    // Try booking at 2:00 AM (outside business hours)
    $response = $this->postJson('/api/bookings/book', [
        'order_date' => now()->setHour(2)->setMinute(0)->format('Y-m-d H:i'),
        'variant_ids' => [$variant->service_variant],
        'guest_info' => [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '09123456789',
        ],
    ]);

    $response->assertStatus(422);
});

test('authenticated booking saves selected vehicle data', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $car = Car::factory()->create([
        'user_id' => $user->user_id,
        'make' => 'Toyota',
        'model' => 'Wigo',
        'size' => 'Small',
    ]);

    $service = Service::factory()->create();
    $variant = ServiceVariant::factory()->create([
        'service_id' => $service->service_id,
        'size' => 'Small',
    ]);

    $response = $this->actingAs($user)->postJson('/api/bookings/book', [
        'order_date' => now()->addHours(2)->format('Y-m-d H:i'),
        'variant_ids' => [$variant->service_variant],
        'car_id' => $car->car_id,
        'vehicle_make' => $car->make,
        'vehicle_model' => $car->model,
        'vehicle_size' => $car->size,
    ]);

    $response->assertStatus(201);

    expect($response->json('car_id'))->toBe($car->car_id);
    expect($response->json('vehicle_make'))->toBe('Toyota');
    expect($response->json('vehicle_model'))->toBe('Wigo');
    expect($response->json('vehicle_size'))->toBe('Small');
});
