<?php

namespace App\Console\Commands;

use App\Models\QueueLine;
use App\Models\ServiceOrder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CancelMissedBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bookings:cancel-missed';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel pending reservations from previous days';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Finding missed bookings to cancel...');

        $missedBookings = ServiceOrder::where('status', 'pending')
            ->where('order_type', 'R')
            ->whereDate('order_date', '<', now('Asia/Manila')->toDateString())
            ->get();

        if ($missedBookings->isEmpty()) {
            $this->info('No missed bookings found.');

            return;
        }

        $count = $missedBookings->count();
        $this->info("Found {$count} missed bookings. Cancelling...");

        DB::transaction(function () use ($missedBookings) {
            $ids = $missedBookings->pluck('service_order_id');

            // Cancel Service Orders
            ServiceOrder::whereIn('service_order_id', $ids)
                ->update(['status' => 'cancelled', 'updated_at' => now()]);

            // Cancel associated Queue Lines if they are in 'waiting' status
            QueueLine::whereIn('service_order_id', $ids)
                ->where('status', 'waiting')
                ->update(['status' => 'cancelled', 'updated_at' => now()]);
        });

        $this->info("Successfully cancelled {$count} missed bookings.");
    }
}
