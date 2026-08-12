<?php

return [
    'driver' => 'file',
    'lifetime' => 120,

    // ok: secure by default, overridable per environment
    'secure' => env('SESSION_SECURE_COOKIE', true),

    // ok: env-driven flag whose default happens to be false is a convention,
    // not the effective runtime value, so it must not fire
    'secure_alt' => env('SESSION_SECURE_COOKIE', false),

    // ok: cookie not exposed to JavaScript
    'http_only' => true,

    // ok: same-site protection kept on
    'same_site' => 'lax',
];
