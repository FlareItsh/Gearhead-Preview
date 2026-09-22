<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplyLedgerDemoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();
        $thirtyDaysAgo = $now->copy()->subDays(30);
        $sixMonthsAgo = $now->copy()->subMonths(6);

        // Clear existing inventory transactions to prevent data pollution
        DB::table('supply_purchases')->delete();
        DB::table('pullout_requests')->delete();
        DB::table('supply_purchase_details')->delete();
        DB::table('pullout_request_details')->delete();
        DB::table('pullout_services')->delete();

        $supplies = DB::table('supplies')->get();

        foreach ($supplies as $supply) {
            $supplyId = $supply->supply_id;
            $runningStock = 0;

            // 1. HISTORICAL TRANSACTIONS (Established before 30 days ago)
            // These will form the "Forwarded Balance" if the user filters for the last 30 days.

            // Initial Stock Purchase
            $histDate = $sixMonthsAgo->copy()->addDays(rand(1, 30));
            $purchaseId = DB::table('supply_purchases')->insertGetId([
                'supplier_id' => rand(1, 2),
                'purchase_reference' => 'HIST-IN-'.$supplyId,
                'purchase_date' => $histDate,
                'created_at' => $histDate,
                'updated_at' => $histDate,
            ], 'supply_purchase_id');

            $qtyIn = rand(80, 150);
            DB::table('supply_purchase_details')->insert([
                'supply_purchase_id' => $purchaseId,
                'supply_id' => $supplyId,
                'quantity' => $qtyIn,
                'unit_price' => rand(10, 100),
                'purchase_date' => $histDate,
                'created_at' => $histDate,
                'updated_at' => $histDate,
            ]);
            $runningStock += $qtyIn;

            // Historical Pullout
            $pullDate = $histDate->copy()->addDays(10);
            $pullId = DB::table('pullout_requests')->insertGetId([
                'employee_id' => rand(1, 5),
                'date_time' => $pullDate,
                'is_approve' => true,
                'approve_by' => 'Admin',
                'approve_date' => $pullDate,
                'created_at' => $pullDate,
                'updated_at' => $pullDate,
            ], 'pullout_request_id');

            $validDetailIds = DB::table('service_order_details')->pluck('service_order_detail_id')->toArray();

            $serviceId = DB::table('pullout_services')->insertGetId([
                'service_order_detail_id' => ! empty($validDetailIds) ? $validDetailIds[array_rand($validDetailIds)] : null,
                'bay_number' => 'Bay '.rand(1, 6),
                'created_at' => $pullDate,
                'updated_at' => $pullDate,
            ], 'pullout_service_id');

            $qtyOut = rand(10, 40);
            DB::table('pullout_request_details')->insert([
                'pullout_request_id' => $pullId,
                'pullout_service_id' => $serviceId,
                'supply_id' => $supplyId,
                'quantity' => $qtyOut,
                'is_returned' => false,
                'created_at' => $pullDate,
                'updated_at' => $pullDate,
            ]);
            $runningStock -= $qtyOut;

            // 2. RECENT TRANSACTIONS (Within last 30 days)
            // These will be visible in the default ledger view.

            // Recent Purchase
            $recentDate = $now->copy()->subDays(rand(10, 20));
            $purchaseId2 = DB::table('supply_purchases')->insertGetId([
                'supplier_id' => rand(1, 2),
                'purchase_reference' => 'REC-IN-'.$supplyId,
                'purchase_date' => $recentDate,
                'created_at' => $recentDate,
                'updated_at' => $recentDate,
            ], 'supply_purchase_id');

            $qtyIn2 = rand(20, 50);
            DB::table('supply_purchase_details')->insert([
                'supply_purchase_id' => $purchaseId2,
                'supply_id' => $supplyId,
                'quantity' => $qtyIn2,
                'unit_price' => rand(10, 100),
                'purchase_date' => $recentDate,
                'created_at' => $recentDate,
                'updated_at' => $recentDate,
            ]);
            $runningStock += $qtyIn2;

            // Recent Pullout
            $recentPullDate = $now->copy()->subDays(rand(1, 5));
            $pullId2 = DB::table('pullout_requests')->insertGetId([
                'employee_id' => rand(1, 5),
                'date_time' => $recentPullDate,
                'is_approve' => true,
                'approve_by' => 'Admin',
                'approve_date' => $recentPullDate,
                'created_at' => $recentPullDate,
                'updated_at' => $recentPullDate,
            ], 'pullout_request_id');

            $serviceId2 = DB::table('pullout_services')->insertGetId([
                'service_order_detail_id' => ! empty($validDetailIds) ? $validDetailIds[array_rand($validDetailIds)] : null,
                'bay_number' => 'Bay '.rand(1, 6),
                'created_at' => $recentPullDate,
                'updated_at' => $recentPullDate,
            ], 'pullout_service_id');

            $qtyOut2 = rand(5, 15);
            DB::table('pullout_request_details')->insert([
                'pullout_request_id' => $pullId2,
                'pullout_service_id' => $serviceId2,
                'supply_id' => $supplyId,
                'quantity' => $qtyOut2,
                'is_returned' => false,
                'created_at' => $recentPullDate,
                'updated_at' => $recentPullDate,
            ]);
            $runningStock -= $qtyOut2;

            // FINAL SYNC: Update the current stock level to match the sum of all transactions
            DB::table('supplies')->where('supply_id', $supplyId)->update(['quantity_stock' => $runningStock]);
        }
    }
}
