<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['trip_id', 'title', 'description', 'location', 'start_time', 'end_time', 'cost'];

    public function trip() {
        return $this->belongsTo(Trip::class);
    }
}