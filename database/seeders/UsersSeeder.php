<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $adminPermissions = [
            'view_dashboard',
            'add_queue',
            'view_registry',
            'start_service',
            'view_queue',
            'view_bookings',
            'view_bays',
            'edit_bay',
            'delete_bay',
            'add_bay',
            'view_services',
            'add_service',
            'edit_service',
            'view_inventory',
            'export_inventory_pdf',
            'add_inventory_item',
            'add_inventory_purchase',
            'pullout_inventory_request',
            'add_inventory_supplier',
            'edit_inventory_item',
            'view_pullout_requests',
            'approve_pullout_request',
            'mark_return_pullout',
            'view_users',
            'edit_user',
            'view_employees',
            'add_employee',
            'edit_employee',
            'delete_employee',
            'view_commissions',
            'view_wallet',
            'manage_payouts',
            'view_transactions',
            'export_transactions_pdf',
            'view_reports',
            'manage_settings',
            'manage_loyalty',
            'manage_gcash',
            'manage_discounts',
            'manage_reviews',
        ];

        $users = [
            [
                'user_id' => 1,
                'first_name' => 'Admin',
                'middle_name' => null,
                'last_name' => 'One',
                'email' => 'admin@example.com',
                'phone_number' => '908818444',
                'address' => null,
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'permissions' => json_encode($adminPermissions),
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'user_id' => 6,
                'first_name' => 'Customer',
                'middle_name' => 'A.',
                'last_name' => 'One',
                'email' => 'customer@example.com',
                'phone_number' => '9103139161',
                'address' => 'Panabo City',
                'password' => Hash::make('password'),
                'role' => 'customer',
                'permissions' => null,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // Generate 5 more customers (Total 6 including hardcoded)
        for ($i = 10; $i < 15; $i++) {
            $users[] = [
                'user_id' => $i,
                'first_name' => 'Customer'.$i,
                'middle_name' => null,
                'last_name' => 'Test',
                'email' => 'customer'.$i.'@example.com',
                'phone_number' => '9'.rand(100000000, 999999999),
                'address' => 'Test Address '.$i,
                'password' => Hash::make('password'),
                'role' => 'customer',
                'permissions' => null,
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach ($users as $u) {
            if (! DB::table('users')->where('user_id', $u['user_id'])->exists()) {
                DB::table('users')->insert($u);
            } else {
                $updateData = [
                    'updated_at' => $now,
                ];
                if (isset($u['permissions'])) {
                    $updateData['permissions'] = $u['permissions'];
                }
                // Only reset customer passwords to "password"
                if ($u['role'] === 'customer') {
                    $updateData['password'] = Hash::make('password');
                }
                $updateData['email_verified_at'] = $now;
                DB::table('users')->where('user_id', $u['user_id'])->update($updateData);
            }
        }
    }
}
