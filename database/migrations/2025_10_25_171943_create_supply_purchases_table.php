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
        Schema::create('supply_purchases', function (Blueprint $table) {
            $table->id('supply_purchase_id');
            $table->foreignId('supplier_id')
                ->constrained('suppliers', 'supplier_id')
                ->onDelete('cascade');
            $table->datetime('purchase_date');
            $table->string('purchase_reference')->nullable()->unique();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supply_purchase');
    }
};
