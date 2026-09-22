<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PulloutRequestsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $requests = [
            ['pullout_request_id' => 1, 'employee_id' => 1, 'date_time' => $now, 'approve_by' => 6, 'approve_date' => null, 'is_approve' => true],
            ['pullout_request_id' => 2, 'employee_id' => 2, 'date_time' => $now, 'approve_by' => 1, 'approve_date' => null, 'is_approve' => true],
            ['pullout_request_id' => 3, 'employee_id' => 3, 'date_time' => $now, 'approve_by' => 6, 'approve_date' => null, 'is_approve' => true],
        ];

        foreach ($requests as $r) {
            unset($r['pullout_request_id']);
            $r['created_at'] = $now;
            $r['updated_at'] = $now;
            DB::table('pullout_requests')->insert($r);
        }
    }
}
