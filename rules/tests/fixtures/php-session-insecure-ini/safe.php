<?php

function harden_session()
{
    // ok: session cookie kept HttpOnly
    ini_set('session.cookie_httponly', 1);

    // ok: session cookie kept Secure
    ini_set('session.cookie_secure', 1);

    // ok: session id only accepted from cookies
    ini_set('session.use_only_cookies', 1);
}
