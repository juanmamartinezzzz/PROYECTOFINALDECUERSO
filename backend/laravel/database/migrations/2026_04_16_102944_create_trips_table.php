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
       Schema::create('trips', function (Blueprint $table) {
        $table->id();
        $table->string('title');        // Nombre del viaje
        $table->string('destination');  // Destino
        $table->date('start_date');     // Fecha inicio
        $table->date('end_date');       // Fecha fin
        $table->string('invite_code')->unique(); // Código de invitación
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
