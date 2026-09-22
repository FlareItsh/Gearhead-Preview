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
        Schema::table('discounts', function (Blueprint $table) {
            $table->enum('applies_to', ['all', 'specific_services'])->default('all')->after('is_active');
            $table->decimal('min_spend', 10, 2)->default(0)->after('applies_to');
        });

        Schema::create('discount_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('discount_id')->constrained('discounts', 'discount_id')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services', 'service_id')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_service');

        Schema::table('discounts', function (Blueprint $table) {
            $table->dropColumn(['applies_to', 'min_spend']);
        });
    }
};
