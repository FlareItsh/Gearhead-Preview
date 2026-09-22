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
        Schema::create('services', function (Blueprint $table) {
            $table->id('service_id');
            $table->string('service_name')->unique();
            $table->text('description');
            $table->string('category');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('service_variants', function (Blueprint $table) {
            $table->id('service_variant');
            $table->foreignId('service_id')
                ->constrained('services', 'service_id')
                ->onDelete('cascade');
            $table->string('size');
            $table->decimal('price', 10, 2);
            $table->integer('estimated_duration')->comment('Duration in minutes');
            $table->timestamps();

            // Unique constraint to prevent duplicate variants for same service
            $table->unique(['service_id', 'size']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_variants');
        Schema::dropIfExists('services');
    }
};
