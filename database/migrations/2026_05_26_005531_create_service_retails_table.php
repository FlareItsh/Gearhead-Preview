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
        Schema::create('service_retails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_variant_id')
                ->constrained('service_variants', 'service_variant')
                ->onDelete('cascade');
            $table->foreignId('supply_id')
                ->constrained('supplies', 'supply_id')
                ->onDelete('cascade');
            $table->decimal('quantity_needed', 10, 2);
            $table->timestamps();

            // Prevent duplicate supply entries for the same service variant
            $table->unique(['service_variant_id', 'supply_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_retails');
    }
};
