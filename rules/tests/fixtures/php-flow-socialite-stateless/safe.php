<?php

use Laravel\Socialite\Facades\Socialite;

function redirect_to_provider()
{
    // ok: default stateful flow validates the OAuth state parameter
    return Socialite::driver('google')->redirect();
}

function handle_callback()
{
    // ok: stateful user() call
    return Socialite::driver('google')->user();
}

function unrelated($cache)
{
    // ok: a stateless() method on some other object, not a Socialite driver
    return $cache->stateless();
}
