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
        Schema::create('queue_lines', function (Blueprint $table) {
            $table->id('queue_line_id');
            $table->foreignId('service_order_id')->constrained('service_orders', 'service_order_id')->onDelete('cascade');
            $table->enum('status', ['waiting', 'completed', 'cancelled'])->default('waiting');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_lines');
    }
};
