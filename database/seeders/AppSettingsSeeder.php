<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AppSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $settings = [
            [
                'key' => 'loyalty_free_wash_threshold',
                'value' => '9',
                'group' => 'loyalty',
            ],
        ];

        foreach ($settings as $setting) {
            if (! DB::table('app_settings')->where('key', $setting['key'])->exists()) {
                $setting['created_at'] = $now;
                $setting['updated_at'] = $now;
                DB::table('app_settings')->insert($setting);
            }
        }
    }
}
