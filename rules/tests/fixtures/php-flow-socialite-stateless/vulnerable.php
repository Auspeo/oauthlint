<?php

use Laravel\Socialite\Facades\Socialite;

function redirect_to_provider()
{
    // ruleid: auth.php.flow.socialite-stateless
    return Socialite::driver('google')->stateless()->redirect();
}

function callback_with_scopes()
{
    // ruleid: auth.php.flow.socialite-stateless
    return Socialite::driver('github')->scopes(['user:email'])->stateless()->user();
}

function via_instance($socialite)
{
    // ruleid: auth.php.flow.socialite-stateless
    return $socialite->driver('google')->stateless()->user();
}
