<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HotelController extends Controller
{
    public function getHotels($tripId) {
        $hoteles = DB::table('hotels')->where('trip_id', $tripId)->orderBy('check_in', 'asc')->get();
        return response()->json($hoteles);
    }

    public function storeHotel(Request $request, $tripId) {
        $validated = $request->validate([
            'name' => 'required|string',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'address' => 'nullable|string',
            'booking_url' => 'nullable|url'
        ]);

        $id = DB::table('hotels')->insertGetId(array_merge($validated, [
            'trip_id' => $tripId,
            'created_at' => now(),
            'updated_at' => now()
        ]));

        return response()->json(DB::table('hotels')->where('id', $id)->first(), 201);
    }
}
