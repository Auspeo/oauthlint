<?php

function claims_from_jwt(string $authHeader): array
{
    $jwtParts = explode('.', $authHeader);
    // ruleid: auth.php.jwt.manual-decode-no-verify
    return json_decode(base64_decode($jwtParts[1]), true);
}

function subject_from_bearer(string $bearer)
{
    $tokenSegments = explode('.', $bearer);
    // ruleid: auth.php.jwt.manual-decode-no-verify
    $payload = json_decode(base64_decode($tokenSegments[1]));
    return $payload->sub;
}
