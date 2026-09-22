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
        Schema::table('service_orders', function (Blueprint $table) {
            $table->foreignId('car_id')->nullable()->after('user_id')->constrained('cars', 'car_id')->nullOnDelete();
            $table->string('vehicle_make', 100)->nullable()->after('car_id');
            $table->string('vehicle_model', 100)->nullable()->after('vehicle_make');
            $table->string('vehicle_size', 20)->nullable()->after('vehicle_model');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('car_id');
            $table->dropColumn(['vehicle_make', 'vehicle_model', 'vehicle_size']);
        });
    }
};
