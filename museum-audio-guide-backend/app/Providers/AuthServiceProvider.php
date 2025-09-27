<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        //
    ];

    public function boot(): void
    {
        $this->registerPolicies();
        Gate::define('superadmin', function ($user) {
                return $user->status === 'superadmin';
            });
        Gate::define('access-admin', function ($user) {
            return in_array($user->status, ['admin', 'superadmin']);
        });
    }
}