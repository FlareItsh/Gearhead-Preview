<?php

use App\Models\Car;
use App\Models\User;

test('profile page displays user\'s cars', function () {
    $user = User::factory()->create();
    $car1 = Car::factory()->create(['user_id' => $user->user_id, 'make' => 'Toyota', 'model' => 'Camry']);
    $car2 = Car::factory()->create(['user_id' => $user->user_id, 'make' => 'Honda', 'model' => 'Civic']);

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();

    // Check if the cars prop is passed to the Inertia page
    $response->assertInertia(fn ($page) => $page
        ->has('cars', 2)
        ->where('cars.0.make', 'Toyota')
        ->where('cars.1.make', 'Honda')
    );
});

test('a user can add a car to their profile', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post('/settings/cars', [
            'make' => 'Ford',
            'model' => 'Mustang',
            'year' => 2022,
            'plate_number' => 'XYZ-9876',
            'color' => 'Red',
            'fuel_type' => 'Gas',
            'transmission' => 'Manual',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->assertDatabaseHas('cars', [
        'user_id' => $user->user_id,
        'make' => 'Ford',
        'model' => 'Mustang',
        'year' => 2022,
        'plate_number' => 'XYZ-9876',
        'color' => 'Red',
        'size' => 'X-Large',
        'fuel_type' => 'Gas',
        'transmission' => 'Manual',
    ]);
});

test('a user cannot add a car with missing required fields', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post('/settings/cars', [
            'make' => '',
            'model' => '',
        ]);

    $response->assertSessionHasErrors(['make', 'model']);
    $this->assertDatabaseCount('cars', 0);
});

test('a user cannot add a car with an unknown model', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->post('/settings/cars', [
            'make' => 'Toyota',
            'model' => 'Imaginary Runner',
        ]);

    $response->assertSessionHasErrors(['model']);
    $this->assertDatabaseCount('cars', 0);
});

test('a user can delete their car', function () {
    $user = User::factory()->create();
    $car = Car::factory()->create(['user_id' => $user->user_id]);

    $response = $this
        ->actingAs($user)
        ->delete("/settings/cars/{$car->car_id}");

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->assertDatabaseMissing('cars', [
        'car_id' => $car->car_id,
    ]);
});

test('a user cannot delete someone else\'s car', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $car = Car::factory()->create(['user_id' => $user2->user_id]);

    $response = $this
        ->actingAs($user1)
        ->delete("/settings/cars/{$car->car_id}");

    $response->assertStatus(403);
    $this->assertDatabaseHas('cars', [
        'car_id' => $car->car_id,
    ]);
});

test('a user can get suggestions for car models from the local vehicle index', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/api/cars/suggest?query=Camry');

    $response
        ->assertOk()
        ->assertJsonFragment([
            'make' => 'Toyota',
            'model' => 'Camry',
            'size' => 'Large',
            'year' => null,
            'class' => null,
        ]);
});

test('car model suggestions prefer the selected make and typed model prefix', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/api/cars/suggest?make=Toyota&query=wi');

    $response
        ->assertOk()
        ->assertJsonPath('0.make', 'Toyota')
        ->assertJsonPath('0.model', 'Wigo')
        ->assertJsonPath('0.size', 'Small');
});
