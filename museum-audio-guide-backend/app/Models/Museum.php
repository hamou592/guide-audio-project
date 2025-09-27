<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Museum extends Model
{
    protected $fillable = [
        'title',
        'description',
        'photo'
    ];

    // Get all rooms in this museum
    public function rooms()
    {
        return $this->hasMany(Room::class, 'museum_id');
    }

    // Get all tickets for this museum
    public function tickets()
    {
        return $this->hasMany(Ticket::class, 'museum_id');
    }

    // Get all objects in this museum (through rooms)
    public function objects()
    {
        return $this->hasManyThrough(
            MuseumObject::class,
            Room::class,
            'museum_id', // Foreign key on rooms table
            'room_id',   // Foreign key on museum_objects table
            'id',        // Local key on museums table
            'id'         // Local key on rooms table
        );
    }
public function users()
{
    return $this->hasMany(User::class);
}
}