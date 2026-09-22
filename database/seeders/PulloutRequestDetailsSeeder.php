<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PulloutRequestDetailsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $details = [
            ['pullout_request_details_id' => 1, 'pullout_service_id' => 1, 'supply_id' => 1, 'pullout_request_id' => 1, 'quantity' => 2, 'is_returned' => false],
            ['pullout_request_details_id' => 2, 'pullout_service_id' => 1, 'supply_id' => 2, 'pullout_request_id' => 1, 'quantity' => 4, 'is_returned' => false],
            ['pullout_request_details_id' => 3, 'pullout_service_id' => 2, 'supply_id' => 8, 'pullout_request_id' => 2, 'quantity' => 5, 'is_returned' => true, 'returned_at' => $now->subDays(1), 'returned_by' => 'Admin'],
            ['pullout_request_details_id' => 4, 'pullout_service_id' => 3, 'supply_id' => 9, 'pullout_request_id' => 3, 'quantity' => 1, 'is_returned' => false],
            ['pullout_request_details_id' => 5, 'pullout_service_id' => 3, 'supply_id' => 15, 'pullout_request_id' => 3, 'quantity' => 2, 'is_returned' => true, 'returned_at' => $now->subHours(2), 'returned_by' => 'Admin'],
            ['pullout_request_details_id' => 6, 'pullout_service_id' => 1, 'supply_id' => 1, 'pullout_request_id' => 2, 'quantity' => 1, 'is_returned' => true, 'returned_at' => $now->subMinutes(30), 'returned_by' => 'Admin'],
        ];

        foreach ($details as $d) {
            unset($d['pullout_request_details_id']);
            $d['created_at'] = $now;
            $d['updated_at'] = $now;
            DB::table('pullout_request_details')->insert($d);
        }
    }
}
