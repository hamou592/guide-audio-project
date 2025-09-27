<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::table('tickets', function (Blueprint $table) {
        $table->dropForeign(['user_id']); // If there's a foreign key
        $table->dropColumn('user_id');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down()
{
    Schema::table('tickets', function (Blueprint $table) {
        $table->unsignedBigInteger('user_id')->nullable();
        // If you want to restore the foreign key:
        // $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    });
}
};
