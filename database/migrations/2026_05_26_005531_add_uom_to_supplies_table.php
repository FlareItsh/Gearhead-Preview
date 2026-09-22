<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->string('purchase_unit')->nullable()->after('unit');
            $table->string('base_unit')->nullable()->after('purchase_unit');
            $table->decimal('conversion_factor', 10, 2)->default(1.00)->after('base_unit');
        });

        // Migrate existing data: copy 'unit' to 'purchase_unit' and 'base_unit'
        DB::table('supplies')->update([
            'purchase_unit' => DB::raw('unit'),
            'base_unit' => DB::raw('unit'),
            'conversion_factor' => 1.00,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplies', function (Blueprint $table) {
            $table->dropColumn(['purchase_unit', 'base_unit', 'conversion_factor']);
        });
    }
};
