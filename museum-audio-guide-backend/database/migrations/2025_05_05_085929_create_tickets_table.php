<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');
            $table->string('qr_code', 10)->unique();  // Changed to 10 digits numeric code
            $table->dateTime('purchase_time')->nullable();
            $table->dateTime('expiration_time')->nullable();
            $table->enum('status', ['active', 'expired'])->default('active');
            $table->timestamps();
        });
    }


    
    public function down()
    {
        Schema::dropIfExists('tickets');
    }
};