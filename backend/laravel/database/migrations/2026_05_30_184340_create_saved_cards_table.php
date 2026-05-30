<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('card_holder');
            $table->string('card_number_last4', 4);
            $table->string('card_expiry');
            $table->string('card_type')->default('visa'); // visa, mastercard
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_cards');
    }
};
