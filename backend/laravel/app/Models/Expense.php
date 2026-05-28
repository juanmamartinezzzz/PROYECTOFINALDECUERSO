<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = ['trip_id', 'payer_id', 'concept', 'amount', 'currency', 'expense_date'];

    public function trip() {
        return $this->belongsTo(Trip::class);
    }

    public function payer() {
        return $this->belongsTo(User::class, 'payer_id');
    }

    public function splits() {
        return $this->hasMany(ExpenseSplit::class);
    }
}
