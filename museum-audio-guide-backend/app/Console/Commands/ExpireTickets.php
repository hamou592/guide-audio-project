<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ExpireTickets extends Command
{
    
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tickets:expire';

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
        ->where('status', '!=', 'expired')
        ->where('purchase_time', '<=', now()->subDay())
        ->update(['status' => 'expired']);
    $this->info('Expired tickets updated.');
}
}
