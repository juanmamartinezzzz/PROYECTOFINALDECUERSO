<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Trip extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 
        'destination', 
        'start_date', 
        'end_date', 
        'invite_code',
        'image'
    ];

    /**
     * Relación con los usuarios que participan en el viaje.
     * Añadimos withTimestamps para saber cuándo se unió cada uno.
     */
    public function members() {
        return $this->belongsToMany(User::class, 'trip_members')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    /**
     * Relación con los gastos del viaje.
     */
    public function expenses() {
        return $this->hasMany(Expense::class);
    }

    /**
     * Accesor para obtener el total gastado en el viaje fácilmente.
     * Esto te servirá para mostrarlo en el frontend directamente.
     */
    public function getTotalGastadoAttribute() {
        return $this->expenses()->sum('amount');
    }

    public function activities() {
        return $this->hasMany(Activity::class);
    }

    public function accommodations() {
        return $this->hasMany(Accommodation::class);
    }
}