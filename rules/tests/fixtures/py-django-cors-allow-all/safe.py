# django-cors-headers settings in a Django settings module.

# ok: auth.py.django.cors-allow-all -- allow-all disabled
CORS_ALLOW_ALL_ORIGINS = False

# ok: auth.py.django.cors-allow-all -- legacy setting disabled
CORS_ORIGIN_ALLOW_ALL = False

# ok: auth.py.django.cors-allow-all -- explicit trusted allow-list instead
CORS_ALLOWED_ORIGINS = [
    "https://app.example.com",
    "https://admin.example.com",
]
