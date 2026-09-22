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
        Schema::create('supply_purchase_details', function (Blueprint $table) {
            $table->id('supply_purchase_details_id');
            $table->foreignId('supply_purchase_id')
                ->constrained('supply_purchases', 'supply_purchase_id')
                ->onDelete('cascade');
            $table->foreignId('supply_id')
                ->constrained('supplies', 'supply_id')
                ->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 10, 2);
            $table->timestamp('purchase_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supply_purchase_details');
    }
};
