<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PaymentsSeeder extends Seeder
{
    public function run(): void
    {
        $orderIds = DB::table('service_orders')->pluck('service_order_id')->toArray();
        $payments = [];
        foreach ($orderIds as $index => $orderId) {
            $order = DB::table('service_orders')->where('service_order_id', $orderId)->first();
            if (! $order) {
                continue;
            }

            $details = DB::table('service_order_details as sod')
                ->join('service_variants as sv', 'sod.service_variant', '=', 'sv.service_variant')
                ->where('sod.service_order_id', $orderId)
                ->select(DB::raw('SUM(sv.price * sod.quantity) as total'))
                ->first();

            $amount = $details->total ?? rand(300, 2000);
            $payment_method = rand(0, 1) ? 'cash' : 'gcash';
            $is_point_redeemed = (bool) rand(0, 1);
            $gcash_reference = $payment_method === 'gcash' ? (string) rand(1000000000000, 9999999999999) : null;

            $created = $order->order_date;
            $updated = date('Y-m-d H:i:s', strtotime($created.' +2 hours'));

            $employeeId = $order->employee_id ?? rand(1, 10);

            DB::table('payments')->insert([
                'service_order_id' => $orderId,
                'employee_id' => $employeeId,
                'amount' => $amount,
                'payment_method' => $payment_method,
                'is_point_redeemed' => $is_point_redeemed,
                'gcash_reference' => $gcash_reference,
                'created_at' => $created,
                'updated_at' => $updated,
            ]);
        }
    }
}
