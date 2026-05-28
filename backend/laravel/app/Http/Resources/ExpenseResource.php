<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trip_id' => $this->trip_id,
            'concepto' => $this->concept,
            'importe' => (float) $this->amount, 
            'moneda' => $this->currency,
            'fecha_gasto' => $this->expense_date,
            
            'pagador' => new UserResource($this->whenLoaded('payer')),
        ];
    }
}
