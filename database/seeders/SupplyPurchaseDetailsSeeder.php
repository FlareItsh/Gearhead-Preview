<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplyPurchaseDetailsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $details = [];

        // Define date range for purchase_date (April to June 2026)
        $start = strtotime('2026-04-01 00:00:00');
        $end = strtotime('2026-06-30 23:59:59');

        $purchaseIds = DB::table('supply_purchases')->pluck('supply_purchase_id')->toArray();
        $supplyIds = DB::table('supplies')->pluck('supply_id')->toArray();

        if (empty($purchaseIds) || empty($supplyIds)) {
            return;
        }

        foreach ($purchaseIds as $purchaseId) {
            $numDetails = rand(1, 5); // Multiple details per purchase

            for ($j = 0; $j < $numDetails; $j++) {
                $supplyId = $supplyIds[array_rand($supplyIds)];

                // Scale down quantity and unit price to reduce expenses
                $quantity = rand(5, 40);
                $unitPrice = rand(5, 40);

                // Random purchase_date in April-June 2026
                $purchase_date = date('Y-m-d H:i:s', rand($start, $end));

                $details[] = [
                    'supply_purchase_id' => $purchaseId,
                    'supply_id' => $supplyId,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'purchase_date' => $purchase_date,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        DB::table('supply_purchase_details')->insert($details);
    }
}
