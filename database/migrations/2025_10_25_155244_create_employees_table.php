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
        Schema::create('employees', function (Blueprint $table) {
            $table->id('employee_id');
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('phone_number')->unique();
            $table->string('address');
            $table->enum('status', ['active', 'absent', 'inactive'])->default('active');
            $table->enum('assigned_status', ['available', 'assigned', 'on_leave'])->default('available');
            $table->date('date_hired')->useCurrent();
            $table->timestamp('employment_ended_at')->nullable();

            // Constraint to prevent duplicates
            $table->unique(['first_name', 'last_name', 'phone_number'], 'emp_unique');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
