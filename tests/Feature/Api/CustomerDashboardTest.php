<?php

use App\Models\Payment;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('customer can fetch their payments', function () {
    $user = User::factory()->create(['role' => 'customer']);
    $serviceOrder = ServiceOrder::factory()->create(['user_id' => $user->user_id]);

    Payment::factory()->create([
        'service_order_id' => $serviceOrder->service_order_id,
        'amount' => 1000,
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('payments.user'));

    $response->assertStatus(200)
        ->assertJsonStructure([
            'paginated' => ['data'],
            'summary' => ['total_spent', 'total_count'],
        ]);
});

test('customer can fetch their upcoming bookings', function () {
    $user = User::factory()->create(['role' => 'customer']);

    ServiceOrder::factory()->create([
        'user_id' => $user->user_id,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($user)
        ->getJson(route('bookings.upcoming'));

    $response->assertStatus(200)
        ->assertJsonCount(1);
});

test('unauthorized user cannot fetch customer payments', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)
        ->getJson(route('payments.user'));

    $response->assertStatus(302); // Redirected by AdminRole middleware
});
