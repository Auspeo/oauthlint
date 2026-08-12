<?php

function set_positional_secure($v)
{
    // ok: Secure and HttpOnly both enabled
    setcookie('session_id', $v, time() + 3600, '/', '', true, true);
}

function set_array_secure($v)
{
    // ok: secure, httponly and a strict same-site policy
    setcookie('sid', $v, ['secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
}

function set_session_params()
{
    // ok: secure and httponly enabled
    session_set_cookie_params(3600, '/', '', true, true);
}

function set_non_auth_cookie($v)
{
    // ok: not an auth-related cookie name
    setcookie('theme', $v, 0, '/', '', true, false);
}
