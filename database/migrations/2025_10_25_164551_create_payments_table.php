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
        Schema::create('payments', function (Blueprint $table) {
            $table->id('payment_id');
            $table->foreignId('service_order_id')
                ->constrained('service_orders', 'service_order_id')
                ->onDelete('cascade')
                ->unique(); // One payment per order to prevent double charging
            $table->foreignId('employee_id')
                ->nullable()
                ->constrained('employees', 'employee_id')
                ->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->enum('payment_method', ['cash', 'gcash', 'loyalty']);
            $table->boolean('is_point_redeemed')->default(false);
            $table->string('gcash_reference')->nullable();
            $table->string('gcash_screenshot')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
