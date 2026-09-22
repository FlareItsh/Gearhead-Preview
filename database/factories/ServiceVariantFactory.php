<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ServiceVariant>
 */
class ServiceVariantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'service_id' => \App\Models\Service::factory(),
            'size' => $this->faker->randomElement(['S', 'M', 'L', 'XL', 'XXL']),
            'price' => $this->faker->numberBetween(150, 500),
            'estimated_duration' => $this->faker->numberBetween(15, 120),
        ];
    }
}
