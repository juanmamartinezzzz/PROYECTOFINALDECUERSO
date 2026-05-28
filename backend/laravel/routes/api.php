<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FriendshipController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\ActivityController;      
use App\Http\Controllers\Api\TripMessageController;  
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// --- RUTAS PÚBLICAS ---
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/verify-email', [AuthController::class, 'verifyCode']);

// --- RUTAS PROTEGIDAS (Requieren Token de React) ---
Route::middleware('auth:sanctum')->group(function () {
    
    // 1. Datos del Usuario y Perfil
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/user/profile', [AuthController::class, 'getProfile']); 
    // Usamos POST para asegurar que la subida de la imagen (multipart/form-data) funcione sin problemas
    Route::post('/user/update', [AuthController::class, 'updateProfile']);

    // 2. Viajes (Trips)
    Route::apiResource('trips', TripController::class);
    Route::post('/trips/join', [TripController::class, 'unirsePorCodigo']);
    Route::get('/trips/{trip}/members', [TripController::class, 'getMembers']);

    // 3. Gastos Compartidos (Finanzas)
    Route::get('/trips/{trip}/expenses', [ExpenseController::class, 'getViajeExpenses']);
    Route::post('/trips/{trip}/expenses', [ExpenseController::class, 'storeViajeGasto']);
    Route::apiResource('expenses', ExpenseController::class)->except(['index', 'store']);

    // 4. Itinerario y Agenda de viajes
    Route::get('/trips/{trip}/activities', [ActivityController::class, 'getActivities']);
    Route::post('/trips/{trip}/activities', [ActivityController::class, 'storeActivity']);

    // 5. Chat de Grupo de la Escapada
    Route::get('/trips/{trip}/messages', [TripMessageController::class, 'getMessages']);
    Route::post('/trips/{trip}/messages', [TripMessageController::class, 'storeMessage']);
    Route::get('/chat/notificaciones', [ChatController::class, 'checkNotificaciones']);
    Route::post('/chat/marcar-leidos/{amigoId}', [ChatController::class, 'marcarLeidos']);
    // 6. Sistema Social (Amigos y Peticiones)
    Route::get('/usuarios/buscar', [FriendshipController::class, 'search']);
    Route::get('/amigos/listado', [FriendshipController::class, 'index']);
    Route::get('/peticiones-pendientes', [FriendshipController::class, 'pendingRequests']);
    Route::post('/peticiones/enviar/{id}', [FriendshipController::class, 'sendRequest']);
    Route::post('/peticiones/aceptar/{id}', [FriendshipController::class, 'acceptRequest']);

    // 7. Chat Directo / Sincrónico entre Amigos
    Route::get('/chat/mensajes/{amigoId}', [ChatController::class, 'getMensajes']);
    Route::post('/chat/enviar', [ChatController::class, 'enviar']);
});
