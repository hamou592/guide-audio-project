<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MuseumObject;
use Illuminate\Http\Request;

class MuseumObjectController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->status === 'superadmin') {
                // Superadmin sees all objects
                $objects = MuseumObject::with(['room.museum'])->get();
            } else if ($user->status === 'admin' && $user->museum_id) {
                // Admin sees only objects from their museum's rooms
                $objects = MuseumObject::with(['room.museum'])
                    ->whereHas('room', function($query) use ($user) {
                        $query->where('museum_id', $user->museum_id);
                    })
                    ->get();
            } else {
                return response()->json([], 200);
            }

            return response()->json($objects);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching objects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getRooms(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->status === 'superadmin') {
                // Superadmin sees all rooms
                $rooms = Room::all();
            } else if ($user->status === 'admin' && $user->museum_id) {
                // Admin sees only their museum's rooms
                $rooms = Room::where('museum_id', $user->museum_id)->get();
            } else {
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
    $validated = $request->validate([
        'room_id' => 'required|exists:rooms,id',
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'photo' => 'nullable|string',
        'audio' => 'nullable|string'
    ]);

    try {
        $object = MuseumObject::create($validated);
        return response()->json($object->load('room'), 201);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error creating object',
            'error' => $e->getMessage()
        ], 500);
    }
}


    public function show($id)
    {
        $object = MuseumObject::with(['room.museum'])->findOrFail($id);
        return response()->json($object);
    }


    public function update(Request $request, $id)
{
    $validated = $request->validate([
        'room_id' => 'required|exists:rooms,id',
        'title' => 'required|string|max:255',
        'description' => 'required|string',
        'photo' => 'nullable|string',
        'audio' => 'nullable|string'
    ]);

    try {
        $object = MuseumObject::findOrFail($id);
        $object->update($validated);
        return response()->json($object->load('room'));
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error updating object',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function destroy($id)
    {
        try {
            $object = MuseumObject::findOrFail($id);
            $object->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error deleting object',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function uploadPhoto(Request $request)
{
    $request->validate([
        'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:4096'
    ]);

    $file = $request->file('photo');
    $filename = time() . '_' . $file->getClientOriginalName();
    $file->move(public_path('images'), $filename);

    return response()->json(['filename' => $filename]);
}

public function uploadAudio(Request $request)
{
    $request->validate([
        'audio' => 'required|mimes:mp3,wav,ogg,webm|max:10240'
    ]);

    $file = $request->file('audio');
    $filename = time() . '_' . $file->getClientOriginalName();
    $file->move(public_path('images'), $filename);

    return response()->json(['filename' => $filename]);
}
    
}