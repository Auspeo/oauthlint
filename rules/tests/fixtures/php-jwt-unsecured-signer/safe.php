<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;

function lcobucci_symmetric()
{
    // ok: real HMAC signer with a key from the environment
    return Configuration::forSymmetricSigner(new Sha256(), InMemory::base64Encoded(getenv('K')));
}

function firebase_hs256($j, $k)
{
    // ok: pinned HS256 algorithm
    return JWT::decode($j, new Key($k, 'HS256'));
}

function firebase_encode($p, $k)
{
    // ok: real algorithm
    return JWT::encode($p, $k, 'HS256');
}
