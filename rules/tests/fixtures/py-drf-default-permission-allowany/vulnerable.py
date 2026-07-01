from rest_framework.permissions import AllowAny

# ruleid: auth.py.drf.default-permission-allowany
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
}


# ruleid: auth.py.drf.default-permission-allowany
REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [AllowAny],
}
