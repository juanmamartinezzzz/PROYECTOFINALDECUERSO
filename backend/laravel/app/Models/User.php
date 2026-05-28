<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; 

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
    'name',
    'email',
    'password',
    'avatar',
    'bio',          
    'preferencia',  
    'transporte',    
    'verification_code',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- RELACIONES DE VIAJES ---

    public function trips() {
        return $this->belongsToMany(Trip::class, 'trip_members')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function expenses() {
        // Asegúrate de que en tu migración de gastos usaste 'paid_by'
        return $this->hasMany(Expense::class, 'paid_by'); 
    }

    // --- RELACIONES SOCIALES (Sincronizadas con tu migración) ---

    /**
     * Amigos confirmados (aceptada = 1)
     */
    public function amigos() {
    
    return $this->belongsToMany(User::class, 'friendships', 'user_id', 'amigo_id')
                ->wherePivot('aceptada', true)
                ->withTimestamps()
                ->union(
                    $this->belongsToMany(User::class, 'friendships', 'amigo_id', 'user_id')
                         ->wherePivot('aceptada', true)
                );
}
    /**
     * Peticiones de amistad que el usuario ha recibido y están pendientes (aceptada = 0)
     */
    public function peticionesRecibidas() {
        return $this->belongsToMany(User::class, 'friendships', 'amigo_id', 'user_id')
                    ->wherePivot('aceptada', false)
                    ->withTimestamps();
    }

    // --- RELACIONES DE CHAT ---

    public function mensajesEnviados() {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function mensajesRecibidos() {
        return $this->hasMany(Message::class, 'receiver_id');
    }
}