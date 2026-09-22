<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'category' => $this->faker->randomElement(['Basic', 'Premium', 'Deluxe']),
            'status' => 'active',
        ];
    }
}
