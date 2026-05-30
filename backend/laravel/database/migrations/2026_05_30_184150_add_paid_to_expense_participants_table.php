<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense_participants', function (Blueprint $table) {
            $table->boolean('paid')->default(false)->after('user_id');
            $table->string('payment_method')->nullable()->after('paid'); // 'bizum' o 'tarjeta'
            $table->timestamp('paid_at')->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('expense_participants', function (Blueprint $table) {
            $table->dropColumn(['paid', 'payment_method', 'paid_at']);
        });
    }
};
