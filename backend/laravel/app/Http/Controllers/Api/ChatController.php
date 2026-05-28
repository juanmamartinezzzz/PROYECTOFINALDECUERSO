<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    private function getNombreTablaChat()
    {
        $posiblesTablas = ['messages', 'chats', 'messages_private', 'private_messages'];
        foreach ($posiblesTablas as $tabla) {
            if (Schema::hasTable($tabla)) {
                return $tabla;
            }
        }
        throw new \Exception("No se encontró ninguna tabla de mensajes.");
    }

    public function getMensajes($amigoId)
    {
        try {
            $userId = Auth::id();
            $tablaChat = $this->getNombreTablaChat();
            $columnas = Schema::getColumnListing($tablaChat);
            
            $colEmisor = in_array('sender_id', $columnas) ? 'sender_id' : 'user_id';
            $colReceptor = in_array('receiver_id', $columnas) ? 'receiver_id' : 'amigo_id';
            $colTexto = in_array('content', $columnas) ? 'content' : (in_array('message', $columnas) ? 'message' : 'texto');

            $mensajes = DB::table($tablaChat)
                ->where(function($q) use ($userId, $amigoId, $colEmisor, $colReceptor) {
                    $q->where($colEmisor, $userId)->where($colReceptor, $amigoId);
                })
                ->orWhere(function($q) use ($userId, $amigoId, $colEmisor, $colReceptor) {
                    $q->where($colEmisor, $amigoId)->where($colReceptor, $userId);
                })
                ->orderBy('created_at', 'asc')
                ->select('id', "{$colEmisor} as from_user_id", "{$colReceptor} as to_user_id", "{$colTexto} as content", 'created_at')
                ->get();

            return response()->json($mensajes, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function enviar(Request $request)
    {
        try {
            $request->validate([
                'amigo_id' => 'required|integer',
                'mensaje' => 'required|string'
            ]);

            $userId = Auth::id();
            $tablaChat = $this->getNombreTablaChat();
            $columnas = Schema::getColumnListing($tablaChat);
            
            $colEmisor = in_array('sender_id', $columnas) ? 'sender_id' : 'user_id';
            $colReceptor = in_array('receiver_id', $columnas) ? 'receiver_id' : 'amigo_id';
            $colTexto = in_array('content', $columnas) ? 'content' : (in_array('message', $columnas) ? 'message' : 'texto');

            $id = DB::table($tablaChat)->insertGetId([
                $colEmisor => $userId,
                $colReceptor => $request->amigo_id,
                $colTexto => $request->mensaje,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'id' => $id,
                'from_user_id' => $userId,
                'to_user_id' => $request->amigo_id,
                'content' => $request->mensaje,
                'created_at' => now()
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    

    public function checkNotificaciones()
    {
        try {
            $userId = Auth::id();
            $tablaChat = $this->getNombreTablaChat();
            $columnas = Schema::getColumnListing($tablaChat);
            $colReceptor = in_array('receiver_id', $columnas) ? 'receiver_id' : 'amigo_id';

            // Comprueba si hay mensajes para ti donde read_at sea null
            $hayNuevos = DB::table($tablaChat)
                ->where($colReceptor, $userId)
                ->whereNull('read_at') 
                ->exists();

            return response()->json(['hay_nuevos' => $hayNuevos]);
        } catch (\Exception $e) {
            return response()->json(['hay_nuevos' => false]);
        }
    }

    public function marcarLeidos($amigoId)
    {
        try {
            $userId = Auth::id();
            $tablaChat = $this->getNombreTablaChat();
            $columnas = Schema::getColumnListing($tablaChat);
            $colEmisor = in_array('sender_id', $columnas) ? 'sender_id' : 'user_id';
            $colReceptor = in_array('receiver_id', $columnas) ? 'receiver_id' : 'amigo_id';

            DB::table($tablaChat)
                ->where($colEmisor, $amigoId)
                ->where($colReceptor, $userId)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}