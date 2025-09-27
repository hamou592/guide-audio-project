<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Ticket extends Model
{
    protected $fillable = [
        // 'user_id',
        'museum_id', // Add this
        'qr_code',
        'purchase_time',
        'expiration_time',
        'status'
    ];
    protected $casts = [
        'purchase_time' => 'datetime',
        'expiration_time' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ticket) {
            // Generate a unique 10-digit numeric code
            do {
                $code = str_pad(mt_rand(1, 9999999999), 10, '0', STR_PAD_LEFT);
            } while (self::where('qr_code', $code)->exists());
            
            $ticket->qr_code = $code;
            $ticket->purchase_time = now();
            $ticket->expiration_time = now()->addDay();
            $ticket->status = 'active';
        });
    }

    // Get the user that owns this ticket
    // public function user()
    // {
    //     return $this->belongsTo(User::class, 'user_id');
    // }

    // Add museum relationship
    public function museum()
    {
        return $this->belongsTo(Museum::class, 'museum_id');
    }

    public function updateStatus()
{
    $purchaseTime = Carbon::parse($this->purchase_time);
    $now = Carbon::now();
    $hoursSincePurchase = $now->diffInHours($purchaseTime);

    if ($this->status === 'active' && $hoursSincePurchase > 24) {
        $this->status = 'expired';
        $this->save();
    }
}

public function isExpired()
{
    $purchaseTime = Carbon::parse($this->purchase_time);
    $now = Carbon::now();
    $hoursSincePurchase = $now->diffInHours($purchaseTime);

    return $this->status !== 'active' || $hoursSincePurchase > 24;
}
}