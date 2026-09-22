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
        Schema::create('pullout_services', function (Blueprint $table) {
            $table->id('pullout_service_id');
            $table->foreignId('service_order_detail_id')
                ->constrained('service_order_details', 'service_order_detail_id')
                ->onDelete('cascade');
            $table->string('bay_number');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pullout_services');
    }
};
