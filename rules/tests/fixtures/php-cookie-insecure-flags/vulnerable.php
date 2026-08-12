<?php

function set_positional($v)
{
    // ruleid: auth.php.cookie.insecure-flags
    setcookie('session_id', $v, time() + 3600, '/', '', true, false);
}

function set_positional_zero($v)
{
    // ruleid: auth.php.cookie.insecure-flags
    setcookie('auth_token', $v, 0, '/', '', true, 0);
}

function set_array_httponly($v)
{
    // ruleid: auth.php.cookie.insecure-flags
    setcookie('sid', $v, ['expires' => 0, 'httponly' => false, 'secure' => true]);
}

function set_array_secure($v)
{
    // ruleid: auth.php.cookie.insecure-flags
    setcookie('remember_me', $v, ['secure' => false, 'httponly' => true]);
}

function set_array_samesite($v)
{
    // ruleid: auth.php.cookie.insecure-flags
    setcookie('csrf_token', $v, ['samesite' => 'None', 'secure' => true]);
}

function set_session_params()
{
    // ruleid: auth.php.cookie.insecure-flags
    session_set_cookie_params(3600, '/', '', false, false);
}
