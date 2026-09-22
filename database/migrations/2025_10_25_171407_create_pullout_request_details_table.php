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
        Schema::create('pullout_request_details', function (Blueprint $table) {
            $table->id('pullout_request_details_id');
            $table->foreignId('pullout_service_id')
                ->constrained('pullout_services', 'pullout_service_id')
                ->onDelete('cascade');
            $table->foreignId('supply_id')
                ->constrained('supplies', 'supply_id')
                ->onDelete('cascade');
            $table->foreignId('pullout_request_id')
                ->constrained('pullout_requests', 'pullout_request_id')
                ->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->boolean('is_returned')->default(false);
            $table->dateTime('returned_at')->nullable();
            $table->string('returned_by')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pullout_request_details');
    }
};
