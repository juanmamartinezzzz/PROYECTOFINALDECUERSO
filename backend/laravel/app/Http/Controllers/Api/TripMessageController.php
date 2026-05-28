<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema; // 🎯 IMPORTANTE: Añade esta línea

class TripMessageController extends Controller
{
    public function getMessages($tripId)
    {
        try {
            // Usamos la fachada Schema correctamente
            $tabla = Schema::hasTable('trip_messages') ? 'trip_messages' : 'messages';

            $messages = DB::table($tabla)
                ->join('users', "{$tabla}.user_id", '=', 'users.id')
                ->where("{$tabla}.trip_id", $tripId)
                ->select("{$tabla}.id", "{$tabla}.message", "{$tabla}.user_id", 'users.name as user_name')
                ->orderBy("{$tabla}.created_at", 'asc')
                ->get();

            return response()->json($messages, 200);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }

    public function storeMessage(Request $request, $tripId)
    {
        try {
            $request->validate([
                'message' => 'required|string',
            ]);

            $userId = Auth::id();
            $userName = Auth::user() ? Auth::user()->name : 'Usuario';
            
            // Usamos la fachada Schema correctamente
            $tabla = Schema::hasTable('trip_messages') ? 'trip_messages' : 'messages';

            $id = DB::table($tabla)->insertGetId([
                'trip_id' => intval($tripId),
                'user_id' => $userId,
                'message' => $request->message,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'id' => $id,
                'message' => $request->message,
                'user_id' => $userId,
                'user_name' => $userName
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Fallo al insertar',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}