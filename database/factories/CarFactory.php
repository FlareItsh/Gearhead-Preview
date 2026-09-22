<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Car>
 */
class CarFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'make' => $this->faker->randomElement(['Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW']),
            'model' => $this->faker->word(),
            'year' => $this->faker->numberBetween(2000, 2026),
            'plate_number' => strtoupper($this->faker->bothify('???-####')),
            'color' => $this->faker->safeColorName(),
            'size' => $this->faker->randomElement(['Small', 'Medium', 'Large', 'X-Large', 'XX-Large']),
            'fuel_type' => $this->faker->randomElement(['Gas', 'Diesel', 'Electric', 'Hybrid']),
            'transmission' => $this->faker->randomElement(['Automatic', 'Manual']),
        ];
    }
}
