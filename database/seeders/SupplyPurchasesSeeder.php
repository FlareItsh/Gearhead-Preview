<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplyPurchasesSeeder extends Seeder
{
    public function run(): void
    {
        $monthTimeline = [];
        foreach ([4, 5, 6] as $month) {
            for ($i = 1; $i <= 5; $i++) {
                $day = rand(1, 28);
                $hour = rand(8, 18);
                $min = rand(0, 59);
                $dateStr = sprintf('2026-%02d-%02d %02d:%02d:00', $month, $day, $hour, $min);
                $monthTimeline[] = $dateStr;
            }
        }
        shuffle($monthTimeline);
        $supplierIds = DB::table('suppliers')->pluck('supplier_id')->toArray();
        if (empty($supplierIds)) {
            return;
        }

        $purchases = [];
        $totalPurchases = count($monthTimeline);
        for ($i = 1; $i <= $totalPurchases; $i++) {
            $purchaseDate = $monthTimeline[$i - 1];
            $created = date('Y-m-d H:i:s', strtotime($purchaseDate.' -'.rand(1, 24).' hours'));
            $updated = date('Y-m-d H:i:s', strtotime($created.' +'.rand(1, 12).' hours'));
            $supplierId = $supplierIds[array_rand($supplierIds)];
            $purchases[] = [
                'supply_purchase_id' => $i,
                'supplier_id' => $supplierId,
                'purchase_date' => $purchaseDate,
                'created_at' => $created,
                'updated_at' => $updated,
            ];
        }
        foreach ($purchases as $p) {
            unset($p['supply_purchase_id']);
            DB::table('supply_purchases')->insert($p);
        }
    }
}
