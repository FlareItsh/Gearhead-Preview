<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuppliesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $supplies = [
            ['supply_id' => 1, 'supply_name' => 'Car shampoo', 'unit' => 'Bottle', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 2, 'supply_name' => 'Degreasers', 'unit' => 'Bottle', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 3, 'supply_name' => 'Wheel cleaner', 'unit' => 'Bottle', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 4, 'supply_name' => 'Glass cleaner', 'unit' => 'Bottle', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 5, 'supply_name' => 'Interior cleaner', 'unit' => 'Bottle', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 6, 'supply_name' => 'Upholstery shampoo', 'unit' => 'gal', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 7, 'supply_name' => 'Tire shine', 'unit' => 'Bottle', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 8, 'supply_name' => 'Wax', 'unit' => 'gal', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 9, 'supply_name' => 'Disinfectant spray', 'unit' => 'Bottle', 'reorder_point' => 5, 'supply_type' => 'consumables', 'quantity_stock' => 0],
            ['supply_id' => 10, 'supply_name' => 'Pressure washer', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 11, 'supply_name' => 'Water hose', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 12, 'supply_name' => 'Buckets', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 13, 'supply_name' => 'Vacuum cleaner', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 14, 'supply_name' => 'buffer machine', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 15, 'supply_name' => 'Microfiber towel', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 16, 'supply_name' => 'Wash mitts or sponges', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 17, 'supply_name' => 'drying towel', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 18, 'supply_name' => 'Brushes', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 19, 'supply_name' => 'Detailing brushes', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
            ['supply_id' => 20, 'supply_name' => 'Applicator pads', 'unit' => 'pc', 'reorder_point' => 5, 'supply_type' => 'supply', 'quantity_stock' => 0],
        ];
        foreach ($supplies as $s) {
            if (! DB::table('supplies')->where('supply_id', $s['supply_id'])->exists()) {
                $s['created_at'] = $now;
                $s['updated_at'] = $now;
                DB::table('supplies')->insert($s);
            }
        }
    }
}
