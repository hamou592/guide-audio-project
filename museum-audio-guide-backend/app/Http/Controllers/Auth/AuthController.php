<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
   public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'museum_title' => 'required|string|max:255',
            'museum_description' => 'nullable|string',
            'museum_photo' => 'nullable|string'
        ]);

        try {
            \DB::beginTransaction();

            // 1. Create the museum
            $museum = \App\Models\Museum::create([
                'title' => $request->museum_title,
                'description' => $request->museum_description,
                'photo' => $request->museum_photo
            ]);

            // 2. Create the user and link to museum
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'status' => 'admin', // Default status
                'museum_id' => $museum->id
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            \DB::commit();

            return response()->json([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'message' => 'Registration successful'
            ], 201);

        } catch (\Exception $e) {
            \DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            $token = $user->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'user' => $user,
                'token' => $token,
                'message' => 'Login successful'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid login credentials'
        ], 401);
    }

public function logout(Request $request)
{
    try {
        // Delete all tokens for the current user instead of just the current token
        $request->user()->tokens()->delete();
        
        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error during logout',
            'error' => $e->getMessage()
        ], 500);
    }
}


public function uploadRegistrationPhoto(Request $request)
{
    $request->validate([
        'photo' => 'required|image|max:2048' // 2MB max
    ]);

    try {
        // Get the uploaded file
        $file = $request->file('photo');

        // Create a unique filename
        $filename = time() . '_' . $file->getClientOriginalName();

        // Move the file to public/images folder
        $file->move(public_path('images'), $filename);

        // Return the relative path from public folder
        return response()->json([
            'success' => true,
            'filename' =>   $filename
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Failed to upload photo'
        ], 500);
    }
}
}