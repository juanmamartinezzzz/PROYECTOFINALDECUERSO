<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FriendshipController extends Controller
{
    private function getNombreTablaChat()
    {
        $posiblesTablas = ['messages', 'chats', 'messages_private', 'private_messages'];
        foreach ($posiblesTablas as $tabla) {
            if (Schema::hasTable($tabla)) return $tabla;
        }
        return 'messages'; // Fallback
    }

    public function search(Request $request)
    {
        $query = $request->get('query'); 
        if (!$query) return response()->json([]);

        $users = User::where('id', '!=', Auth::id())
            ->where(function($q) use ($query) {
                $q->where('name', 'LIKE', "%$query%")
                  ->orWhere('email', 'LIKE', "%$query%");
            })->limit(10)->get();

        return response()->json($users);
    }

    public function sendRequest($id)
    {
        $userId = Auth::id();

        if ($userId == $id) {
            return response()->json(['message' => 'No puedes enviarte una petición a ti mismo.'], 400);
        }

        $relacionExistente = DB::table('friendships')
            ->where(function ($query) use ($userId, $id) {
                $query->where('user_id', $userId)->where('amigo_id', $id);
            })
            ->orWhere(function ($query) use ($userId, $id) {
                $query->where('user_id', $id)->where('amigo_id', $userId);
            })
            ->first();

        if ($relacionExistente) {
            if ($relacionExistente->aceptada) {
                return response()->json(['message' => 'Ya sois amigos.'], 400);
            }
            return response()->json(['message' => 'Ya hay una petición pendiente.'], 400);
        }

        DB::table('friendships')->insert([
            'user_id' => $userId,
            'amigo_id' => $id,
            'aceptada' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json(['message' => 'Petición enviada con éxito.'], 201);
    }

    public function pendingRequests()
    {
        try {
            $userId = Auth::id();
            $peticiones = DB::table('friendships')
                ->join('users', 'friendships.user_id', '=', 'users.id')
                ->where('friendships.amigo_id', $userId)
                ->where('friendships.aceptada', false)
                ->select('users.id', 'users.name', 'users.email')
                ->get();

            return response()->json($peticiones);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function acceptRequest($id)
    {
        try {
            $userId = Auth::id();
            $actualizado = DB::table('friendships')
                ->where('user_id', $id)
                ->where('amigo_id', $userId)
                ->update(['aceptada' => true, 'updated_at' => now()]);

            if (!$actualizado) {
                return response()->json(['message' => 'No se encontró la petición'], 404);
            }
            return response()->json(['message' => '¡Ahora sois amigos!']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function index()
    {
        try {
            $userId = Auth::id();
            
            $amigos = DB::table('friendships')
                ->join('users', function($join) use ($userId) {
                    $join->on('users.id', '=', 'friendships.user_id')
                         ->where('friendships.amigo_id', '=', $userId)
                         ->orOn('users.id', '=', 'friendships.amigo_id')
                         ->where('friendships.user_id', '=', $userId);
                })
                ->where('friendships.aceptada', true)
                ->where('users.id', '!=', $userId)
                ->select('users.id', 'users.name', 'users.email')
                ->distinct()
                ->get();

            // Lógica para añadir contador de mensajes no leídos
            try {
                $tablaChat = $this->getNombreTablaChat();
                $columnas = Schema::getColumnListing($tablaChat);
                $colEmisor = in_array('sender_id', $columnas) ? 'sender_id' : 'user_id';
                $colReceptor = in_array('receiver_id', $columnas) ? 'receiver_id' : 'amigo_id';

                foreach ($amigos as $amigo) {
                    $amigo->unread_count = DB::table($tablaChat)
                        ->where($colEmisor, $amigo->id)
                        ->where($colReceptor, $userId)
                        ->whereNull('read_at')
                        ->count();
                }
            } catch (\Exception $ex) {
                // Si falla la tabla de chat, ponemos a 0
                foreach ($amigos as $amigo) {
                    $amigo->unread_count = 0;
                }
            }

            return response()->json($amigos, 200);
        } catch (\Exception $e) {
            return response()->json([], 200);
        }
    }
}