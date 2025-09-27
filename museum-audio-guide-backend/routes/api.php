<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\TicketController;
use App\Http\Controllers\API\MuseumController;
use App\Http\Controllers\API\RoomController;
use App\Http\Controllers\API\MuseumObjectController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UserController;
// Public routes
// Route::get('public/museum-rooms/{ticketCode}', [TicketController::class, 'museumRoomsByTicket']); // this is for getting rooms of specific meseum
// Route::get('public/museum-room-objects/{ticketCode}/{roomTitle}', [TicketController::class, 'museumRoomObjectsByTicket']); //this is for getting objects of specific room
// Route::get('public/object-details/{ticketCode}/{objectTitle}', [TicketController::class, 'objectDetailsByTicket']); //this is for getting objects details data
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/register/upload-photo', [AuthController::class, 'uploadRegistrationPhoto']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('tickets/verify/{qrCode}', [TicketController::class, 'verifyTicket']);



// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Admin and Superadmin routes
    Route::middleware(['can:access-admin'])->group(function () {
        // Routes for admin access
        Route::apiResource('rooms', RoomController::class);
        Route::post('/rooms/upload-photo', [RoomController::class, 'uploadPhoto']);
        Route::apiResource('objects', MuseumObjectController::class);
        Route::post('/objects/upload-photo', [MuseumObjectController::class, 'uploadPhoto']);
        Route::post('/objects/upload-audio', [MuseumObjectController::class, 'uploadAudio']);
        Route::get('/objects/rooms', [MuseumObjectController::class, 'getRooms']);
        Route::apiResource('tickets', TicketController::class);
        Route::get('tickets/{id}/qr', [TicketController::class, 'showQrCode']);
        Route::get('tickets/museums', [TicketController::class, 'getMuseums']);
    });

    Route::get('public/museum-rooms/{ticketCode}', [TicketController::class, 'museumRoomsByTicket']); // this is for getting rooms of specific meseum
    Route::get('public/museum-room-objects/{ticketCode}/{roomTitle}', [TicketController::class, 'museumRoomObjectsByTicket']); //this is for getting objects of specific room
    Route::get('public/object-details/{ticketCode}/{objectTitle}', [TicketController::class, 'objectDetailsByTicket']); //this is for getting objects details data

    // Superadmin only routes
    Route::middleware(['can:access-admin', 'superadmin'])->group(function () {
        Route::apiResource('museums', MuseumController::class);
        Route::post('/museums/upload-photo', [MuseumController::class, 'uploadPhoto']);
        Route::apiResource('users', UserController::class);
    });
});