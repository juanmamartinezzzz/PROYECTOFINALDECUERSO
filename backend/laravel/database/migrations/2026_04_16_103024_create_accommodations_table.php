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
        Schema::create('accommodations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trip_id')->constrained()->onDelete('cascade');
            $table->string('hotel_name'); // Nombre del hotel o Airbnb
            $table->string('address')->nullable(); // Dirección física
            $table->date('check_in'); // Fecha de entrada
            $table->date('check_out'); // Fecha de salida
            $table->decimal('price', 10, 2)->nullable(); // Precio total de la reserva
            $table->string('booking_reference')->nullable(); // Código de reserva
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accommodations');
    }
};
