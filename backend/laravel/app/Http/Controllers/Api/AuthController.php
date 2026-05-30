<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request) {
        $fields = $request->validate([
            'name' => 'required|string|max:20|unique:users,name', 
            'email' => 'required|string|unique:users,email',
            'password' => ['required', 'string', Password::min(8)->letters()->mixedCase()->numbers()]
        ]);

        $codigoRandom = (string) rand(100000, 999999);

        $user = User::create([
            'name' => $fields['name'],
            'email' => $fields['email'],
            'password' => Hash::make($fields['password']),
            'verification_code' => $codigoRandom
        ]);

        try {
            $mensajeHtml = "
                <h2>¡Bienvenido a ViaVia, {$user->name}!</h2>
                <p>Para activar tu cuenta y comenzar a organizar tus viajes, introduce el siguiente código de verificación en la aplicación:</p>
                <div style='background-color:#f4f7f6; padding:15px; text-align:center; font-size:24px; font-weight:bold; letter-spacing:5px; color:#11998e; border-radius:8px; max-width:200px; margin: 0 auto;'>
                    {$codigoRandom}
                </div>
                <p>Si no te has registrado en nuestra web, puedes ignorar este correo de forma segura.</p>
            ";

            Mail::html($mensajeHtml, function ($mail) use ($user) {
                $mail->to($user->email)
                     ->subject('🔑 Código de verificación - ViaVia');
            });
        } catch (\Exception $e) {
            logger("Error enviando correo de verificación: " . $e->getMessage());
        }

        return response([
            'message' => 'Usuario registrado. Código enviado al email.',
            'email' => $user->email
        ], 201);
    }

    public function verifyCode(Request $request) {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || $user->verification_code !== $request->code) {
            return response(['message' => 'El código introducido es incorrecto o inválido'], 400);
        }

        $user->email_verified_at = now();
        $user->verification_code = null;
        $user->save();

        $token = $user->createToken('viavia_token')->plainTextToken;

        return response([
            'user' => $user,
            'token' => $token,
            'message' => '¡Cuenta verificada e inicio de sesión correcto!'
        ], 200);
    }

    public function login(Request $request) {
        $fields = $request->validate([
            'email' => 'required|string',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $fields['email'])->first();

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response(['message' => 'Credenciales incorrectas'], 401);
        }

        $token = $user->createToken('viavia_token')->plainTextToken;

        return response(['user' => $user, 'token' => $token], 200);
    }

    public function getProfile() {
        $user = Auth::user();
        $erroresDebug = [];

        $viajesCreados = 0;
        $paisesVisitados = 0;
        $amigosActivos = 0;

        try {
            $viajesCreados = DB::table('trip_user')->where('user_id', $user->id)->count();
            $paisesVisitados = DB::table('trips')
                ->join('trip_user', 'trips.id', '=', 'trip_user.trip_id')
                ->where('trip_user.user_id', $user->id)
                ->distinct('trips.destination')
                ->count('trips.destination');
        } catch (\Exception $e) {
            $erroresDebug['error_viajes'] = $e->getMessage();
        }

        try {
            $amigosActivos = DB::table('friendships')
                ->where(function($query) use ($user) {
                    $query->where('user_id', $user->id)->orWhere('amigo_id', $user->id);
                })
                ->where('aceptada', true)
                ->count();
        } catch (\Exception $e) {
            $erroresDebug['error_amigos'] = $e->getMessage();
        }

        // Construir avatar_url desde la ruta guardada en 'avatar'
        if ($user->avatar) {
            $user->avatar_url = asset('storage/' . $user->avatar);
        }

        return response()->json([
            'user' => $user,
            'estadisticas' => [
                'viajesCompletados' => $viajesCreados,
                'paisesVisitados' => $paisesVisitados,
                'amigosActivos' => $amigosActivos
            ],
            'debug_secreto' => $erroresDebug
        ], 200);
    }

    public function updateProfile(Request $request) {
        
        $rules = [
            'name'        => 'required|string|max:20',
            'bio'         => 'nullable|string',
            'preferencia' => 'nullable|string',
            'transporte'  => 'nullable|string',
        ];

        if ($request->hasFile('avatar')) {
            $rules['avatar'] = 'image|mimes:jpeg,png,jpg,gif|max:5120';
        }

        $request->validate($rules);

        $user = $request->user();

        $user->name        = $request->input('name', $user->name);
        $user->bio         = $request->input('bio', $user->bio);
        $user->preferencia = $request->input('preferencia', $user->preferencia);
        $user->transporte  = $request->input('transporte', $user->transporte);

        if ($request->hasFile('avatar')) {
            // Borrar avatar antiguo si existe
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            // Guardar ruta relativa en columna 'avatar'
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        $user->save();

        // Construir la URL completa antes de devolver
        $user->avatar_url = $user->avatar ? asset('storage/' . $user->avatar) : null;

        return response()->json([
            'message' => 'Perfil actualizado con éxito',
            'user' => $user
        ], 200);
    }
    public function getTarjetas()
    {
        $userId = Auth::id();
        $tarjetas = DB::table('saved_cards')->where('user_id', $userId)->get();
        return response()->json($tarjetas);
    }

    public function guardarTarjeta(Request $request)
    {
        $request->validate([
            'card_holder'      => 'required|string',
            'card_number_last4'=> 'required|string|size:4',
            'card_expiry'      => 'required|string',
            'card_type'        => 'required|string',
        ]);

        $userId = Auth::id();

        $id = DB::table('saved_cards')->insertGetId([
            'user_id'           => $userId,
            'card_holder'       => $request->card_holder,
            'card_number_last4' => $request->card_number_last4,
            'card_expiry'       => $request->card_expiry,
            'card_type'         => $request->card_type,
            'created_at'        => now(),
            'updated_at'        => now()
        ]);

        return response()->json(['message' => 'Tarjeta guardada.', 'id' => $id], 201);
    }

    public function eliminarTarjeta($cardId)
    {
        $userId = Auth::id();
        DB::table('saved_cards')->where('id', $cardId)->where('user_id', $userId)->delete();
        return response()->json(['message' => 'Tarjeta eliminada.']);
    }
}