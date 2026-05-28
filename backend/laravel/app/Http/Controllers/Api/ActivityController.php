<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityController extends Controller
{
    /**
     * Listar las actividades del itinerario
     */
    public function getActivities($tripId)
    {
        try {
            // Ordenamos primero por día y luego por hora
            $activities = DB::table('activities')
                ->where('trip_id', $tripId)
                ->orderBy('date', 'asc')
                ->orderBy('time', 'asc')
                ->get();

            $formatted = $activities->map(function($act) {
                return [
                    'id' => $act->id,
                    'title' => $act->activity, // Traducimos 'activity' de la BD a 'title' para React
                    'description' => $act->notes ?? '', // Traducimos 'notes' a 'description'
                    'scheduled_at' => $act->date . ' ' . $act->time, // Unimos las dos columnas
                    'hora' => date('H:i', strtotime($act->time)) // Sacamos solo la hora limpia
                ];
            });

            return response()->json($formatted, 200);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }

    /**
     * Guardar una nueva actividad
     */
    public function storeActivity(Request $request, $tripId)
    {
        try {
            $request->validate([
                'title' => 'required|string',
                'scheduled_at' => 'required',
            ]);

            // React nos envía un string "YYYY-MM-DD HH:MM:SS". Lo separamos para tu base de datos:
            $fecha = date('Y-m-d', strtotime($request->scheduled_at));
            $hora = date('H:i:s', strtotime($request->scheduled_at));

            // Inserción clavada con las columnas reales de tu migración
            $id = DB::table('activities')->insertGetId([
                'trip_id' => $tripId,
                'activity' => $request->title,        
                'date' => $fecha,                     
                'time' => $hora,                     
                'notes' => $request->description ?? null, 
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'id' => $id, 
                'title' => $request->title,
                'scheduled_at' => $request->scheduled_at
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}