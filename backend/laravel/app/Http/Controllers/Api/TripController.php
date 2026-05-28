<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Http\Resources\TripResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str; 
use Illuminate\Support\Facades\DB; 

class TripController extends Controller
{
    /**
     * Muestra los viajes donde el usuario participa.
     */
    public function index()
    {
        // Trae los viajes asociados al usuario autenticado (o usa fallback si estás testeando sin token)
        $user = auth()->user() ?? \App\Models\User::find(1);
        $trips = $user->trips ?? collect();
        
        return TripResource::collection($trips);
    }

    /**
     * Crea un viaje e invita a amigos seleccionados.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'destination' => 'required|string',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'invitados'   => 'nullable|array',
            'invitados.*' => 'exists:users,id',
        ]);

        // Generamos el código de invitación único
        $validated['invite_code'] = strtoupper(Str::random(6));
        
        // ID del creador actual (Fallback al ID 1 por si pruebas de forma local sin sanctum)
        $currentUserId = auth()->id() ?? 1;
        $validated['creator_id'] = $currentUserId; 

        $trip = Trip::create($validated);

        // Vinculamos al organizador en la tabla pivote trip_members
        $trip->members()->attach($currentUserId, ['role' => 'organizador']);

        // Vinculamos a los amigos invitados
        if (!empty($request->invitados)) {
            $trip->members()->attach($request->invitados, ['role' => 'miembro']);
        }

        return new TripResource($trip);
    }

    /**
     * Muestra un viaje específico con sus relaciones sin romper el Frontend.
     */
    public function show($id)
{
    try {
        // 1. Buscar el viaje de forma limpia
        $viaje = \DB::table('trips')->where('id', $id)->first();

        if (!$viaje) {
            return response()->json(['error' => 'Viaje no encontrado'], 404);
        }

        // 2. Obtener los participantes de la tabla intermedia de manera segura
        // Unimos con la tabla 'users' para obtener sus nombres reales
        $participantes = \DB::table('trip_members')
            ->join('users', 'trip_members.user_id', '=', 'users.id')
            ->where('trip_members.trip_id', $id)
            ->select('users.id', 'users.name')
            ->get();

        // 3. Estructuramos la respuesta exactamente como la espera tu React
        return response()->json([
            'id'          => $viaje->id,
            'title'       => $viaje->title,
            'destination' => $viaje->destination,
            'start_date'  => $viaje->start_date ?? null,
            'end_date'    => $viaje->end_date ?? null,
            'participantes' => $participantes
        ], 200);

    } catch (\Exception $e) {
        // Si algo falla, esto evitará el misterioso error 500 y te dirá qué pasa
        return response()->json([
            'error' => 'Fallo en TripController@show',
            'details' => $e->getMessage()
        ], 500);
    }
}

    /**
     * Actualizar datos del viaje.
     */
    public function update(Request $request, Trip $trip)
    {
        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'destination' => 'sometimes|string',
            'start_date'  => 'sometimes|date',
            'end_date'    => 'sometimes|date|after_or_equal:start_date',
        ]);

        $trip->update($validated);
        return new TripResource($trip);
    }

    /**
     * Eliminar viaje.
     */
    public function destroy(Trip $trip)
    {
        $trip->delete();
        return response()->json(['message' => 'Viaje eliminado correctamente']);
    }

    /**
     * Permite a un usuario unirse a un viaje usando el código.
     */
    public function unirsePorCodigo(Request $request)
    {
        $request->validate(['codigo' => 'required|string']);

        $trip = Trip::where('invite_code', $request->codigo)->first();

        if (!$trip) {
            return response()->json(['message' => 'El código de invitación no existe.'], 404);
        }

        $currentUserId = auth()->id() ?? 1;

        // Validamos la colección para que no se dupliquen registros en la tabla pivote
        if ($trip->members()->where('user_id', $currentUserId)->exists()) {
            return response()->json(['message' => 'Ya eres miembro de este viaje.'], 400);
        }

        $trip->members()->attach($currentUserId, ['role' => 'miembro']);

        return response()->json([
            'message' => '¡Te has unido al viaje con éxito!',
            'trip'    => new TripResource($trip)
        ]);
    }

    /**
     * Devuelve la lista de miembros de un viaje específico.
     */
    public function getMembers($id)
    {
        $trip = Trip::findOrFail($id);
        $currentUserId = auth()->id() ?? 1;

        if (!$trip->members()->where('user_id', $currentUserId)->exists()) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        return response()->json($trip->members);
    }
}
