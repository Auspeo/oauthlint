<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Lcobucci\JWT\Signer\Key\InMemory;

function issue(array $payload): string
{
    // ok: key read from the environment
    return JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
}

function verify(string $jwt)
{
    // ok: key read via getenv()
    return JWT::decode($jwt, new Key(getenv('JWT_SECRET'), 'HS256'));
}

function lcobucci_env()
{
    // ok: key read from config()
    return InMemory::base64Encoded(config('jwt.secret'));
}
