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
        Schema::create('service_order_details', function (Blueprint $table) {
            $table->id('service_order_detail_id');
            $table->foreignId('service_order_id')
                ->constrained('service_orders', 'service_order_id')
                ->onDelete('cascade');
            $table->foreignId('service_variant')
                ->constrained('service_variants', 'service_variant')
                ->onDelete('cascade');
            $table->integer('quantity')->default(1);
            $table->timestamps();

            // Prevent duplicate variants in same order
            $table->unique(['service_order_id', 'service_variant']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_order_details');
    }
};
