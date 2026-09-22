<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $employees = [
            ['employee_id' => 1, 'first_name' => 'Malakai', 'middle_name' => null, 'last_name' => 'Azer', 'phone_number' => '9876543210', 'status' => 'active', 'address' => 'Ilya', 'date_hired' => '2025-09-10', 'employment_ended_at' => null, 'commission_percentage' => 10.00],
            ['employee_id' => 2, 'first_name' => 'Kit', 'middle_name' => 'R.', 'last_name' => 'Azer', 'phone_number' => '9102030405', 'status' => 'active', 'address' => 'Ilya', 'date_hired' => '2025-09-15', 'employment_ended_at' => null, 'commission_percentage' => 12.00],
            ['employee_id' => 3, 'first_name' => 'Paedyn', 'middle_name' => null, 'last_name' => 'Gray', 'phone_number' => '9908070605', 'status' => 'active', 'address' => 'Loot Alley', 'date_hired' => '2025-09-20', 'employment_ended_at' => null, 'commission_percentage' => 15.00],
            ['employee_id' => 4, 'first_name' => 'ding', 'middle_name' => null, 'last_name' => 'castro', 'phone_number' => '9987654432', 'status' => 'active', 'address' => 'Loot Alley', 'date_hired' => '2024-12-05', 'employment_ended_at' => null, 'commission_percentage' => 8.00],
            ['employee_id' => 5, 'first_name' => 'Adena', 'middle_name' => null, 'last_name' => 'Khitan', 'phone_number' => '9987654433', 'status' => 'active', 'address' => 'Loot Alley', 'date_hired' => '2024-12-05', 'employment_ended_at' => null, 'commission_percentage' => 10.00],
        ];
        // Add a few more, up to 10
        for ($i = 6; $i <= 10; $i++) {
            $first = 'Employee'.$i;
            $last = 'Last'.$i;
            $phone = '9'.rand(100000000, 999999999);
            $status = 'active';
            $address = 'Address '.$i;
            $dateHired = '2025-'.rand(1, 12).'-'.rand(1, 28);
            $ended = null;
            $employees[] = [
                'employee_id' => $i,
                'first_name' => $first,
                'middle_name' => null,
                'last_name' => $last,
                'phone_number' => $phone,
                'status' => $status,
                'address' => $address,
                'date_hired' => $dateHired,
                'employment_ended_at' => $ended,
                'commission_percentage' => (float) rand(5, 15),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
        foreach ($employees as $e) {
            if (! DB::table('employees')->where('employee_id', $e['employee_id'])->exists()) {
                DB::table('employees')->insert($e);
            }
        }
    }
}
