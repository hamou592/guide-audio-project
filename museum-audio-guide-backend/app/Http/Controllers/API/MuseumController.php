<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Museum;
use Illuminate\Http\Request;

class MuseumController extends Controller
{
    public function index()
    {
        $museums = Museum::with(['rooms'])->get();
        return response()->json($museums);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|string'
        ]);

        $museum = Museum::create($request->all());
        return response()->json($museum, 201);
    }

    public function show($id)
    {
        $museum = Museum::with(['rooms', 'objects'])->findOrFail($id);
        return response()->json($museum);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|string'
        ]);

        $museum = Museum::findOrFail($id);
        $museum->update($request->all());
        return response()->json($museum);
    }

    public function destroy($id)
    {
        $museum = Museum::findOrFail($id);
        $museum->delete();
        return response()->json(null, 204);
    }
    public function uploadPhoto(Request $request)
{
    $request->validate([
        'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
    ]);

    $file = $request->file('photo');
    $filename = time() . '_' . $file->getClientOriginalName();
    $file->move(public_path('images'), $filename);

    // Return the filename so you can save it in the DB
    return response()->json(['filename' => $filename]);
}
}