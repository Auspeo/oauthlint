from django.http import HttpResponse


def set_insecure_secure(response: HttpResponse, token: str):
    # ruleid: auth.py.cookie.insecure-flags
    response.set_cookie("session", token, secure=False, httponly=True)


def set_insecure_httponly(response: HttpResponse, token: str):
    # ruleid: auth.py.cookie.insecure-flags
    response.set_cookie("session", token, secure=True, httponly=False)


# Django settings module
# ruleid: auth.py.cookie.insecure-flags
SESSION_COOKIE_SECURE = False

# ruleid: auth.py.cookie.insecure-flags
CSRF_COOKIE_SECURE = False

# ruleid: auth.py.cookie.insecure-flags
SESSION_COOKIE_HTTPONLY = False
