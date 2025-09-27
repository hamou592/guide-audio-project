<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use App\Models\Museum;
use App\Models\Room;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\GdImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class TicketController extends Controller
{

    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->status === 'superadmin') {
                // Superadmin sees all tickets
                $tickets = Ticket::with(['museum'])->get();
            } else if ($user->status === 'admin' && $user->museum_id) {
                // Admin sees only tickets from their museum
                $tickets = Ticket::with(['museum'])
                    ->where('museum_id', $user->museum_id)
                    ->get();
            } else {
                return response()->json([], 200);
            }

            return response()->json($tickets);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching tickets',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMuseums(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->status === 'superadmin') {
                // Superadmin sees all museums
                $museums = \App\Models\Museum::all();
            } else if ($user->status === 'admin' && $user->museum_id) {
                // Admin sees only their museum
                $museums = \App\Models\Museum::where('id', $user->museum_id)->get();
            } else {
                return response()->json([], 200);
            }

            return response()->json($museums);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error fetching museums',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
{
    $request->validate([
        // 'user_id' => 'required|exists:users,id',
        'museum_id' => 'required|exists:museums,id'
    ]);

    $ticket = Ticket::create($request->all());
    return response()->json($ticket->load([ 'museum']), 201);
}





    public function show($id)
    {
        $ticket = Ticket::with([ 'museum'])->findOrFail($id);
        
        // Update ticket status if needed
        $ticket->updateStatus();
        
        return response()->json($ticket);
    }

    // public function showQrCode($id)
    // {
    //     $ticket = Ticket::findOrFail($id);
        
    //     // Generate QR code from the numeric code
    //     $qrCode = QrCode::size(300)->generate($ticket->qr_code);
        
    //     return response($qrCode)->header('Content-Type', 'image/svg+xml');
    // }
public function showQrCode($id)
{
    $ticket = Ticket::findOrFail($id);

    // This will use GD if Imagick is not installed
    $qrCode = QrCode::format('svg')
    ->size(300)
    ->generate($ticket->qr_code);
    return response($qrCode)
    ->header('Content-Type', 'image/svg+xml')
    ->header('Content-Disposition', 'inline');
}
    public function verifyTicket($qrCode)
    {
        $ticket = Ticket::where('qr_code', $qrCode)->first();
        
        if (!$ticket) {
            return response()->json(['valid' => false, 'message' => 'Invalid ticket']);
        }

        $ticket->updateStatus();  // This will check if the ticket is expired
    $purchaseTime = \Carbon\Carbon::parse($ticket->purchase_time);
    $now = now();
    $hoursSincePurchase = $now->diffInHours($purchaseTime);
        return response()->json([
            'valid' => !$ticket->isExpired(),
        'status' => $ticket->status,
        'purchase_time' => $ticket->purchase_time,
        'now' => $now,
        'hours_since_purchase' => $hoursSincePurchase,
        'ticket' => $ticket
        ]);
    }



    public function update(Request $request, $id)
    {
        $request->validate([
            // 'user_id' => 'required|exists:users,id',
            'museum_id' => 'required|exists:museums,id',
            'status' => 'required|in:active,expired',
            'qr_code' => 'required|string',
            'purchase_time' => 'required|date',
            'expiration_time' => 'required|date|after:purchase_time'
        ]);
    
        $ticket = Ticket::findOrFail($id);
        $ticket->update([
            // 'user_id' => $request->user_id,
            'museum_id' => $request->museum_id,
            'status' => $request->status,
            'qr_code' => $request->qr_code,
            'purchase_time' => $request->purchase_time,
            'expiration_time' => $request->expiration_time
        ]);
        
        return response()->json($ticket->load(['museum']));
    }


    public function destroy($id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->delete();
        return response()->json(null, 204);
    }

    // Additional method to verify ticket
    public function verify($qr_code)
    {
        $ticket = Ticket::where('qr_code', $qr_code)->firstOrFail();
        $ticket->updateStatus();

        return response()->json([
            'valid' => !$ticket->isExpired(),
            'ticket' => $ticket
        ]);
    }

    public function museumRoomsByTicket($ticketCode)
    {
        $ticket = Ticket::where('qr_code', $ticketCode)->first();
        
        if (!$ticket) {
            return response()->json(['valid' => false, 'message' => 'Invalid ticket'], 404);
        }
    
        // Check if ticket is valid (not expired, status active)
        $ticket->updateStatus();
        if ($ticket->isExpired()) {
            return response()->json(['valid' => false, 'message' => 'Ticket expired'], 403);
        }
    
        $museum = Museum::with('rooms')->find($ticket->museum_id);
    
        if (!$museum) {
            return response()->json(['valid' => false, 'message' => 'Museum not found'], 404);
        }
    
        return response()->json([
            'valid' => true,
            'museum' => $museum,
            'rooms' => $museum->rooms
        ]);
    }

    public function museumRoomObjectsByTicket($ticketCode, $roomTitle)
{
    $ticket = Ticket::where('qr_code', $ticketCode)->first();
    if (!$ticket) {
        return response()->json(['valid' => false, 'message' => 'Invalid ticket'], 404);
    }
    $ticket->updateStatus();
    if ($ticket->isExpired()) {
        return response()->json(['valid' => false, 'message' => 'Ticket expired'], 403);
    }
    $museum = Museum::with('rooms')->find($ticket->museum_id);
    if (!$museum) {
        return response()->json(['valid' => false, 'message' => 'Museum not found'], 404);
    }
    $room = $museum->rooms->where('title', $roomTitle)->first();
    if (!$room) {
        return response()->json(['valid' => false, 'message' => 'Room not found'], 404);
    }
    $objects = \App\Models\MuseumObject::where('room_id', $room->id)->get();
    return response()->json([
        'valid' => true,
        'museum' => $museum,
        'room' => $room,
        'objects' => $objects
    ]);
}

public function objectDetailsByTicket($ticketCode, $objectTitle)
{
    $ticket = Ticket::where('qr_code', $ticketCode)->first();
    if (!$ticket) {
        return response()->json(['valid' => false, 'message' => 'Invalid ticket'], 404);
    }
    $ticket->updateStatus();
    if ($ticket->isExpired()) {
        return response()->json(['valid' => false, 'message' => 'Ticket expired'], 403);
    }
    $museum = Museum::with('rooms')->find($ticket->museum_id);
    if (!$museum) {
        return response()->json(['valid' => false, 'message' => 'Museum not found'], 404);
    }
    // Find the object in any room of this museum by title (case-insensitive)
    $roomIds = $museum->rooms->pluck('id');
    $object = \App\Models\MuseumObject::whereIn('room_id', $roomIds)
        ->whereRaw('LOWER(title) = ?', [strtolower($objectTitle)])
        ->first();
    if (!$object) {
        return response()->json(['valid' => false, 'message' => 'Object not found'], 404);
    }
    return response()->json([
        'valid' => true,
        'object' => $object
    ]);
}


}

