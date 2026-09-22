<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BaysSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $bays = [
            ['bay_id' => 1, 'bay_number' => '1', 'status' => 'available', 'bay_type' => 'Normal'],
            ['bay_id' => 2, 'bay_number' => '2', 'status' => 'available', 'bay_type' => 'Normal'],
            ['bay_id' => 3, 'bay_number' => '3', 'status' => 'available', 'bay_type' => 'Normal'],
            ['bay_id' => 4, 'bay_number' => '4', 'status' => 'available', 'bay_type' => 'Normal'],
            ['bay_id' => 5, 'bay_number' => '5', 'status' => 'available', 'bay_type' => 'Normal'],
            ['bay_id' => 6, 'bay_number' => '6', 'status' => 'available', 'bay_type' => 'Underwash'],
        ];
        foreach ($bays as $b) {
            if (! DB::table('bays')->where('bay_id', $b['bay_id'])->exists()) {
                $b['created_at'] = $now;
                $b['updated_at'] = $now;
                DB::table('bays')->insert($b);
            }
        }
    }
}
