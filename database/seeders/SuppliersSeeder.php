<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SuppliersSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $suppliers = [
            ['supplier_id' => 1, 'first_name' => 'Maria', 'middle_name' => null, 'last_name' => 'Salem', 'phone_number' => '0912345678', 'email' => 'maria@example.com'],
            ['supplier_id' => 2, 'first_name' => 'Tor', 'middle_name' => null, 'last_name' => 'Bagtik', 'phone_number' => '0912345679', 'email' => 'Tor@example.com'],
        ];
        foreach ($suppliers as $s) {
            if (! DB::table('suppliers')->where('supplier_id', $s['supplier_id'])->exists()) {
                DB::table('suppliers')->insert($s);
            }
        }
    }
}
