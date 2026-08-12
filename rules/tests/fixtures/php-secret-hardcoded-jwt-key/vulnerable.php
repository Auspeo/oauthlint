<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Lcobucci\JWT\Signer\Key\InMemory;

function issue(array $payload): string
{
    // ruleid: auth.php.secret.hardcoded-jwt-key
    return JWT::encode($payload, "super-secret-value", 'HS256');
}

function verify(string $jwt)
{
    // ruleid: auth.php.secret.hardcoded-jwt-key
    return JWT::decode($jwt, new Key("super-secret-value", 'HS256'));
}

function lcobucci_plain()
{
    // ruleid: auth.php.secret.hardcoded-jwt-key
    return InMemory::plainText("hardcoded-hmac-key");
}

function lcobucci_b64()
{
    // ruleid: auth.php.secret.hardcoded-jwt-key
    return InMemory::base64Encoded("aGFyZGNvZGVka2V5");
}
