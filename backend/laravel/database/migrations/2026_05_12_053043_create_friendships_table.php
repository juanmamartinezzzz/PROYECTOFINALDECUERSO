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
    Schema::create('friendships', function (Blueprint $table) {
        $table->id();
        // El usuario que envía la petición
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        // El usuario que recibe la petición
        $table->foreignId('amigo_id')->constrained('users')->onDelete('cascade');
        // Estado: 0 = pendiente, 1 = aceptada
        $table->boolean('aceptada')->default(false); 
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('friendships');
    }
};
