<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'titulo'            => $this->title,
            'destino'           => $this->destination,
            'fecha_inicio'      => $this->start_date,
            'fecha_fin'         => $this->end_date,
            'codigo_invitacion' => $this->invite_code,
            'image_url'         => $this->image ? asset('storage/' . $this->image) : null, // ✅
            'miembros'          => $this->whenLoaded('members'),
            'actividades'       => $this->whenLoaded('activities'),
        ];
    }
}
