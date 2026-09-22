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
        Schema::create('staff_payouts', function (Blueprint $table) {
            $table->id('payout_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->onDelete('cascade');
            $table->decimal('amount', 15, 2);
            $table->date('payout_date');
            $table->string('remarks')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users', 'user_id')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('staff_payouts');
    }
};
