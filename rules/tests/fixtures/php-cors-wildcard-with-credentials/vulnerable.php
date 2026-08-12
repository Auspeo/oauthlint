<?php

function cors_wildcard()
{
    // ruleid: auth.php.cors.wildcard-with-credentials
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Credentials: true');
}

function cors_reflected()
{
    // ruleid: auth.php.cors.wildcard-with-credentials
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
    header('Access-Control-Allow-Credentials: true');
}
