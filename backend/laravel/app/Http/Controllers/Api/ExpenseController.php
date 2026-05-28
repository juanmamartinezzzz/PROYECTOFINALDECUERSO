<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Http\Resources\ExpenseResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $tripId = $request->query('trip_id');
        $expenses = Expense::where('trip_id', $tripId)->get();
        return ExpenseResource::collection($expenses);
    }

    public function getViajeExpenses($id)
    {
        $expenses = Expense::where('trip_id', $id)
            ->leftJoin('users', 'expenses.payer_id', '=', 'users.id')
            ->select('expenses.*', 'users.name as user_name')
            ->get();

        $formattedExpenses = $expenses->map(function($expense) {
            // ✅ Traemos los participantes de cada gasto
            $participantes = DB::table('expense_participants')
                ->where('expense_id', $expense->id)
                ->pluck('user_id')
                ->toArray();

            return [
                'id'            => $expense->id,
                'description'   => $expense->concept,
                'descripcion'   => $expense->concept,
                'amount'        => (float) $expense->amount,
                'pagador_id'    => $expense->payer_id,
                'pagador_name'  => $expense->user_name ?? 'Usuario',
                'participantes' => $participantes
            ];
        });

        return response()->json($formattedExpenses, 200);
    }

    public function storeViajeGasto(Request $request, $id)
    {
        $validated = $request->validate([
            'description'     => 'required|string|max:255',
            'amount'          => 'required|numeric',
            'user_id'         => 'required|exists:users,id',
            'participantes'   => 'required|array|min:1',
            'participantes.*' => 'exists:users,id',
        ]);

        $expense = Expense::create([
            'trip_id'      => $id,
            'concept'      => $validated['description'],
            'amount'       => $validated['amount'],
            'payer_id'     => $validated['user_id'],
            'currency'     => 'EUR',
            'expense_date' => now(),
        ]);

        // Guardamos los participantes en la nueva tabla
        foreach ($validated['participantes'] as $participanteId) {
            DB::table('expense_participants')->insert([
                'expense_id' => $expense->id,
                'user_id'    => $participanteId,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        $usuario = DB::table('users')->where('id', $expense->payer_id)->first();

        return response()->json([
            'id'            => $expense->id,
            'trip_id'       => $expense->trip_id,
            'description'   => $expense->concept,
            'descripcion'   => $expense->concept,
            'amount'        => (float) $expense->amount,
            'pagador_id'    => $expense->payer_id,
            'pagador_name'  => $usuario->name ?? 'Usuario',
            'participantes' => $validated['participantes']
        ], 201);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'trip_id'     => 'required|exists:trips,id',
            'description' => 'required|string|max:255',
            'amount'      => 'required|numeric',
        ]);

        $expense = Expense::create([
            'trip_id'      => $validated['trip_id'],
            'concept'      => $validated['description'],
            'amount'       => $validated['amount'],
            'payer_id'     => auth()->id() ?? 1,
            'currency'     => 'EUR',
            'expense_date' => now(),
        ]);

        return new ExpenseResource($expense);
    }

    public function show(Expense $expense)
    {
        return new ExpenseResource($expense);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'description' => 'sometimes|string|max:255',
            'amount'      => 'sometimes|numeric',
        ]);

        if (isset($validated['description'])) {
            $expense->concept = $validated['description'];
        }

        if (isset($validated['amount'])) {
            $expense->amount = $validated['amount'];
        }

        $expense->save();

        return new ExpenseResource($expense);
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return response()->json(['message' => 'Gasto eliminado']);
    }
}