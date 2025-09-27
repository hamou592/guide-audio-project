<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MuseumObject extends Model
{
    protected $table = 'museum_objects';

    protected $fillable = [
        'room_id',
        'title',
        'description',
        'photo',
        'audio'
    ];

   

    // Get the room that owns this object
    public function room()
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    // Get the museum through the room relationship
    public function museum()
    {
        return $this->hasOneThrough(
            Museum::class,
            Room::class,
            'id',        // Foreign key on rooms table
            'id',        // Foreign key on museums table
            'room_id',   // Local key on museum_objects table
            'museum_id'  // Local key on rooms table
        );
    }
}