<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = [
        'museum_id',
        'title',
        'description',
        'photo'
    ];

    // Get the museum that owns this room
    public function museum()
    {
        return $this->belongsTo(Museum::class, 'museum_id');
    }

    // Get all objects in this room
    public function objects()
    {
        return $this->hasMany(MuseumObject::class, 'room_id');
    }
}