<?php

function harden_session_wrong()
{
    // ruleid: auth.php.session.insecure-ini
    ini_set('session.cookie_httponly', 0);

    // ruleid: auth.php.session.insecure-ini
    ini_set('session.cookie_secure', '0');

    // ruleid: auth.php.session.insecure-ini
    ini_set('session.use_only_cookies', false);
}
