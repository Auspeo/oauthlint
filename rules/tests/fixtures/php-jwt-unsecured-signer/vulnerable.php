<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer;

function lcobucci_unsecured()
{
    // ruleid: auth.php.jwt.unsecured-signer
    return Configuration::forUnsecuredSigner();
}

function lcobucci_none()
{
    // ruleid: auth.php.jwt.unsecured-signer
    return new Signer\None();
}

function firebase_key_none($k)
{
    // ruleid: auth.php.jwt.unsecured-signer
    return new Key($k, 'none');
}

function firebase_encode_none($p, $k)
{
    // ruleid: auth.php.jwt.unsecured-signer
    return JWT::encode($p, $k, 'None');
}

function firebase_decode_none($j, $k)
{
    // ruleid: auth.php.jwt.unsecured-signer
    return JWT::decode($j, new Key($k, 'none'));
}
