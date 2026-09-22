<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_orders', function (Blueprint $table) {
            $table->id('service_order_id');

            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->onDelete('cascade');

            $table->foreignId('employee_id')
                ->nullable()
                ->constrained('employees', 'employee_id')
                ->onDelete('set null');

            $table->foreignId('bay_id')
                ->nullable()
                ->constrained('bays', 'bay_id')
                ->onDelete('set null');

            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])
                ->default('pending');

            // changed from timestamp() → dateTime()
            $table->dateTime('order_date');

            $table->enum('order_type', ['W', 'R'])->comment('W = Walk-in, R = Reservation');
            $table->string('idempotency_key')->nullable()->unique(); // Prevent duplicate orders
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};
