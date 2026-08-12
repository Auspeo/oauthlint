<?php

function cors_allowlisted()
{
    $origin = $_SERVER['HTTP_ORIGIN'];
    // ok: origin echoed back only after an allowlist check
    if (in_array($origin, ['https://app.example.com'], true)) {
        header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
    }
}

function cors_origin_only()
{
    // ok: wildcard origin without credentials is not credentialed CORS
    header('Access-Control-Allow-Origin: *');
}

function cors_explicit_with_credentials()
{
    // ok: a single explicit origin (not wildcard, not reflected) with credentials
    header('Access-Control-Allow-Origin: https://app.example.com');
    header('Access-Control-Allow-Credentials: true');
}
