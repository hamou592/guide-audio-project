<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function checkUser(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        if ($user && Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ]);
    }

    public function checkEmail(Request $request)
    {
        $exists = User::where('email', $request->email)->exists();

        return response()->json([
            'exists' => $exists
        ]);
    }

    public function createUser(Request $request)
    {
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password)
            ]);

            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user'
            ]);
        }
    }

    public function index()
    {
        $user = Auth::user();

        if ($user && $user->status === 'superadmin') {
            // Eager load museum (one-to-one) with users
            $users = User::with('museum')->get();
            return response()->json($users);
        }

        return response()->json(['message' => 'Unauthorized'], 403);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'status' => 'required|string',
            'museum' => 'required|array',
            'museum.title' => 'required|string|max:255',
            'museum.description' => 'nullable|string',
            'museum.photo' => 'nullable|string',
        ]);


        try {
        \DB::beginTransaction();
            // Create the museum first
            $museum = \App\Models\Museum::create([
                'title' => $request->museum['title'],
                'description' => $request->museum['description'] ?? null,
                'photo' => $request->museum['photo'] ?? null,
            ]);

            // Create the user with museum_id referencing the created museum
            $user = \App\Models\User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'status' => $request->status,
                'museum_id' => $museum->id,
            ]);

            \DB::commit();

            return response()->json($user->load('museum'), 201);
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'message' => 'Failed to create user and museum: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'status' => 'sometimes|required|string',
            'museum' => 'array',
            'museum.title' => 'required_with:museum|string|max:255',
            'museum.description' => 'nullable|string',
            'museum.photo' => 'nullable|string',
        ]);

        \DB::beginTransaction();

        try {
            $user->update($request->only(['name', 'email', 'status']));

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
                $user->save();
            }

            if ($request->has('museum')) {
                $museumData = $request->museum;
                $museum = $user->museum;

                if ($museum) {
                    $museum->update($museumData);
                } else {
                    // Create new museum and update user's museum_id
                    $newMuseum = \App\Models\Museum::create($museumData);
                    $user->museum_id = $newMuseum->id;
                    $user->save();
                }
            }

            \DB::commit();

            return response()->json($user->load('museum'));
        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'message' => 'Failed to update user and museum: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        if ($user->museum) {
            $user->museum()->delete();
        }
        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }
}