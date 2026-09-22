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
        Schema::table('supply_purchase_details', function (Blueprint $table) {
            $table->decimal('conversion_factor', 10, 2)->default(1.00)->after('quantity');
            $table->decimal('quantity_base', 10, 2)->default(0.00)->after('conversion_factor');
        });

        // Migrate existing data: set conversion_factor to 1.00 and quantity_base to quantity
        DB::table('supply_purchase_details')->update([
            'conversion_factor' => 1.00,
            'quantity_base' => DB::raw('quantity'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supply_purchase_details', function (Blueprint $table) {
            $table->dropColumn(['conversion_factor', 'quantity_base']);
        });
    }
};
