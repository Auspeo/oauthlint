from rest_framework.permissions import IsAuthenticated

# ok: auth.py.drf.default-permission-allowany -- global default is a real permission
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
}


# ok: auth.py.drf.default-permission-allowany -- imported symbol, still not AllowAny
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [IsAuthenticated],
}


# ok: auth.py.drf.default-permission-allowany -- key absent, project relies on DRF default
REST_FRAMEWORK = {
    "DEFAULT_THROTTLE_RATES": {"anon": "10/min"},
}
