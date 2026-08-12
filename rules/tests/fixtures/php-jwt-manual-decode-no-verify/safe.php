<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function claims_verified(string $jwt): array
{
    // ok: signature verified with a pinned algorithm and a key from config
    return (array) JWT::decode($jwt, new Key($_ENV['JWT_SECRET'], 'HS256'));
}

function header_only(string $bearer)
{
    $jwtParts = explode('.', $bearer);
    // ok: decoding the header segment (index 0), not the trusted payload
    return json_decode(base64_decode($jwtParts[0]), true);
}

function decode_image(string $dataUri)
{
    $imageParts = explode(',', $dataUri);
    // ok: generic base64 of a data URI, not a token
    return json_decode(base64_decode($imageParts[1]), true);
}
