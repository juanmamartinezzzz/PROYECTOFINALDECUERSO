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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            // ID del usuario que envía el mensaje (Emisor)
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            // ID del amigo que recibe el mensaje (Receptor)
            $table->foreignId('amigo_id')->constrained('users')->onDelete('cascade');
            // El contenido del mensaje de chat
            $table->text('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};