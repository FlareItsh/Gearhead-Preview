<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceOrderDetailsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $details = [];

        $variantIds = DB::table('service_variants')->pluck('service_variant')->toArray();
        if (empty($variantIds)) {
            return;
        }

        $orderIds = DB::table('service_orders')->pluck('service_order_id')->toArray();

        foreach ($orderIds as $orderId) {
            $numDetails = rand(1, min(3, count($variantIds))); // Multiple details per order

            // Randomly select unique variants for this order
            $shuffledVariants = $variantIds;
            shuffle($shuffledVariants);
            $selectedVariants = array_slice($shuffledVariants, 0, $numDetails);

            foreach ($selectedVariants as $serviceVariant) {
                $details[] = [
                    'service_order_id' => $orderId,
                    'service_variant' => $serviceVariant,
                    'quantity' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('service_order_details')->insert($details);
    }
}
