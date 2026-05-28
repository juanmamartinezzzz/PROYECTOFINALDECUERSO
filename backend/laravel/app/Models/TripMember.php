<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TripMember extends Model
{
    // Laravel por defecto busca la tabla 'trip_members', así que está bien.
    protected $table = 'trip_members';

    protected $fillable = [
        'user_id',
        'trip_id',
        'role'
    ];

    /**
     * Relación con el usuario.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el viaje.
     */
    public function trip()
    {
        return $this->belongsTo(Trip::class);
    }
}