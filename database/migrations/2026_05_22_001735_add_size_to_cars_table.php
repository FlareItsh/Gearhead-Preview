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
        if (! Schema::hasColumn('cars', 'size')) {
            Schema::table('cars', function (Blueprint $table) {
                $table->string('size')->default('Medium')->after('color');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('cars', 'size')) {
            Schema::table('cars', function (Blueprint $table) {
                $table->dropColumn('size');
            });
        }
    }
};
