<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AppSettingsSeeder::class,
            UsersSeeder::class,
            EmployeesSeeder::class,
            SuppliesSeeder::class,
            ServicesSeeder::class,
            BaysSeeder::class,
            SuppliersSeeder::class,
            ServiceOrdersSeeder::class,
            ServiceOrderDetailsSeeder::class,
            PaymentsSeeder::class,
            PulloutRequestsSeeder::class,
            PulloutServicesSeeder::class,
            PulloutRequestDetailsSeeder::class,
            SupplyPurchasesSeeder::class,
            SupplyPurchaseDetailsSeeder::class,
            ReviewsSeeder::class,
        ]);

        $this->command->call('db:sync-sequences');

        $this->call([
            SupplyLedgerDemoSeeder::class,
        ]);

        $this->command->call('db:sync-sequences');
    }
}
