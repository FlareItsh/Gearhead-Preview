<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServicesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $serviceGroups = [
            [
                'name' => 'Basic',
                'description' => 'body wash,vacuum, tire black, blow dry',
                'category' => 'Basic',
                'variants' => [
                    ['size' => 'Small', 'duration' => 50, 'price' => 130],
                    ['size' => 'Medium', 'duration' => 50, 'price' => 150],
                    ['size' => 'Large', 'duration' => 50, 'price' => 200],
                    ['size' => 'X-Large', 'duration' => 50, 'price' => 300],
                    ['size' => 'XX-Large', 'duration' => 50, 'price' => 350],
                ],
            ],
            [
                'name' => 'Underwash',
                'description' => 'body wash,vacuum,tire black,blow dry,underwash',
                'category' => 'Underwash',
                'variants' => [
                    ['size' => 'Small', 'duration' => 60, 'price' => 310],
                    ['size' => 'Medium', 'duration' => 60, 'price' => 340],
                    ['size' => 'Large', 'duration' => 60, 'price' => 390],
                    ['size' => 'X-Large', 'duration' => 60, 'price' => 500],
                ],
            ],
            [
                'name' => 'Enginewash',
                'description' => 'body wash,vacuum,tire black,blow dry,engine wash',
                'category' => 'Enginewash',
                'variants' => [
                    ['size' => 'Small', 'duration' => 60, 'price' => 280],
                    ['size' => 'Medium', 'duration' => 60, 'price' => 330],
                    ['size' => 'Large', 'duration' => 60, 'price' => 350],
                    ['size' => 'X-Large', 'duration' => 60, 'price' => 480],
                    ['size' => 'XX-Large', 'duration' => 60, 'price' => 520],
                ],
            ],
            [
                'name' => 'Hand Wax',
                'description' => 'body wash,vacuum,tire black,blow dry,liquid hand wax',
                'category' => 'Hand Wax',
                'variants' => [
                    ['size' => 'Small', 'duration' => 50, 'price' => 170],
                    ['size' => 'Medium', 'duration' => 50, 'price' => 200],
                    ['size' => 'Large', 'duration' => 50, 'price' => 260],
                    ['size' => 'X-Large', 'duration' => 50, 'price' => 350],
                ],
            ],
            [
                'name' => 'Armor All/All Purpose Dressing',
                'description' => 'Prevent plastic and vinyl from cracking, fading, discoloration, and premature aging',
                'category' => 'Additional Services',
                'variants' => [
                    ['size' => 'Small', 'duration' => 40, 'price' => 60],
                    ['size' => 'Medium', 'duration' => 40, 'price' => 60],
                    ['size' => 'Large', 'duration' => 40, 'price' => 70],
                    ['size' => 'X-Large', 'duration' => 40, 'price' => 90],
                ],
            ],
            [
                'name' => 'Watermarks Removal/Glass Detailing',
                'description' => 'Prevent plastic and vinyl from cracking, fading, discoloration, and premature aging',
                'category' => 'Additional Services',
                'variants' => [
                    ['size' => 'Small', 'duration' => 80, 'price' => 900],
                    ['size' => 'Medium', 'duration' => 80, 'price' => 1200],
                    ['size' => 'Large', 'duration' => 80, 'price' => 1400],
                    ['size' => 'X-Large', 'duration' => 80, 'price' => 1700],
                ],
            ],
            [
                'name' => 'Hard Shell',
                'description' => 'body wash,vacuum,tire black,blow dry,turtle wax',
                'category' => 'Buff Wax',
                'variants' => [
                    ['size' => 'Small', 'duration' => 50, 'price' => 360],
                    ['size' => 'Medium', 'duration' => 50, 'price' => 430],
                    ['size' => 'Large', 'duration' => 50, 'price' => 520],
                    ['size' => 'X-Large', 'duration' => 50, 'price' => 700],
                ],
            ],
            [
                'name' => 'Waterproof',
                'description' => 'body wash,vacuum,tire black,blow dry,botny wax',
                'category' => 'Buff Wax',
                'variants' => [
                    ['size' => 'Small', 'duration' => 50, 'price' => 430],
                    ['size' => 'Medium', 'duration' => 50, 'price' => 520],
                    ['size' => 'Large', 'duration' => 50, 'price' => 660],
                    ['size' => 'X-Large', 'duration' => 50, 'price' => 800],
                ],
            ],
            [
                'name' => 'High Gloss',
                'description' => 'body wash,vacuum,tire black,blow dry,meguar\'s wax',
                'category' => 'Buff Wax',
                'variants' => [
                    ['size' => 'Small', 'duration' => 50, 'price' => 500],
                    ['size' => 'Medium', 'duration' => 50, 'price' => 580],
                    ['size' => 'Large', 'duration' => 50, 'price' => 720],
                    ['size' => 'X-Large', 'duration' => 50, 'price' => 900],
                ],
            ],
            [
                'name' => 'Complete Package (Hard Shell)',
                'description' => 'body wash,vacuum,tire black,blow dry,turtle wax, armor all',
                'category' => 'Complete Package',
                'variants' => [
                    ['size' => 'Small', 'duration' => 120, 'price' => 660],
                    ['size' => 'Medium', 'duration' => 120, 'price' => 740],
                    ['size' => 'Large', 'duration' => 120, 'price' => 930],
                    ['size' => 'X-Large', 'duration' => 120, 'price' => 1100],
                ],
            ],
            [
                'name' => 'Complete Package (Waterproof)',
                'description' => 'body wash,vacuum,tire black,blow dry,botny wax, armor all',
                'category' => 'Complete Package',
                'variants' => [
                    ['size' => 'Small', 'duration' => 120, 'price' => 700],
                    ['size' => 'Medium', 'duration' => 120, 'price' => 790],
                    ['size' => 'Large', 'duration' => 120, 'price' => 1070],
                    ['size' => 'X-Large', 'duration' => 120, 'price' => 1250],
                ],
            ],
            [
                'name' => 'Complete Package (High Gloss)',
                'description' => 'body wash,vacuum,tire black,blow dry,meguir\'s wax, armor all',
                'category' => 'Complete Package',
                'variants' => [
                    ['size' => 'Small', 'duration' => 120, 'price' => 800],
                    ['size' => 'Medium', 'duration' => 120, 'price' => 890],
                    ['size' => 'Large', 'duration' => 120, 'price' => 1130],
                    ['size' => 'X-Large', 'duration' => 120, 'price' => 1350],
                ],
            ],
        ];

        foreach ($serviceGroups as $group) {
            $serviceId = DB::table('services')->insertGetId([
                'service_name' => $group['name'],
                'description' => $group['description'],
                'category' => $group['category'],
                'status' => 'active',
                'created_at' => $now,
                'updated_at' => $now,
            ], 'service_id');

            foreach ($group['variants'] as $variant) {
                DB::table('service_variants')->insert([
                    'service_id' => $serviceId,
                    'size' => $variant['size'],
                    'estimated_duration' => $variant['duration'],
                    'price' => $variant['price'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
