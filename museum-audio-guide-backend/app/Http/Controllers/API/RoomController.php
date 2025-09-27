<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
    
            // If superadmin, show all rooms
            if ($user->status === 'superadmin') {
                $rooms = Room::with(['museum', 'objects'])->get();
            } 
            // If admin, show only rooms for their museum
            else if ($user->status === 'admin' && $user->museum_id) {
                $rooms = Room::with(['museum', 'objects'])
                    ->where('museum_id', $user->museum_id)
                    ->get();
            } 
            // Otherwise, return empty or forbidden
            else {
                return response()->json([], 200);
            }
    
            return response()->json($rooms);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching rooms',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'museum_id' => 'required|exists:museums,id',
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'photo' => 'nullable|string'
            ]);

            $room = Room::create($validated);
            return response()->json($room->load('museum'), 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error creating room',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $room = Room::with(['museum', 'objects'])->findOrFail($id);
            return response()->json($room);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching room',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'museum_id' => 'required|exists:museums,id',
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'photo' => 'nullable|string'
            ]);

            $room = Room::findOrFail($id);
            $room->update($validated);
            return response()->json($room->load('museum'));
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error updating room',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $room = Room::findOrFail($id);
            $room->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting room',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function uploadPhoto(Request $request)
    {
        try {
            $request->validate([
                'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:4096'
            ]);

            $file = $request->file('photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('images'), $filename);

            return response()->json(['filename' => $filename]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error uploading photo',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}