from django.http import HttpResponse


# ok: auth.py.cookie.insecure-flags -- Secure + HttpOnly + SameSite all set
def set_secure_cookie(response: HttpResponse, token: str):
    response.set_cookie("session", token, secure=True, httponly=True, samesite="Lax")


# ok: auth.py.cookie.insecure-flags -- no security kwargs given; framework defaults apply
def set_cookie_no_flags(response: HttpResponse, value: str):
    response.set_cookie("prefs", value)


# ok: auth.py.cookie.insecure-flags -- Django settings hardened
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
