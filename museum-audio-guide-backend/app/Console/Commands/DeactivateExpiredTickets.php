<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DeactivateExpiredTickets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:deactivate-expired-tickets';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        \DB::table('tickets')
        ->where('status', '!=', 'no active')
        ->where('purchase_time', '<=', now()->subHours(24))
        ->update(['status' => 'no active']);
    }
}
