"""OAuth token requests using safe grant types — no ROPC."""

import requests

TOKEN_URL = "https://idp.example.com/oauth/token"


# ok: auth.py.oauth.ropc-grant -- authorization-code flow, the recommended login
def exchange_code(code: str, verifier: str):
    return requests.post(
        TOKEN_URL,
        data={"grant_type": "authorization_code", "code": code, "code_verifier": verifier},
    )


# ok: auth.py.oauth.ropc-grant -- machine-to-machine client credentials
def service_token():
    return requests.post(TOKEN_URL, data={"grant_type": "client_credentials"})


# ok: auth.py.oauth.ropc-grant -- a password-reset endpoint is not the ROPC grant
def reset_password(email: str):
    return requests.post("https://idp.example.com/account", data={"grant_type": "password_reset", "email": email})


# ok: auth.py.oauth.ropc-grant -- grant type comes from a variable, not a literal
def dynamic_grant(grant: str):
    return requests.post(TOKEN_URL, data={"grant_type": grant})


# ok: auth.py.oauth.ropc-grant -- a library's own grant-type resolver binds the
# string to a local variable; it is the implementation of the grant, not an
# application sending a password token request (cf. Authlib _guess_grant_type).
def _guess_grant_type(kwargs):
    if "code" in kwargs:
        grant_type = "authorization_code"
    elif "username" in kwargs and "password" in kwargs:
        grant_type = "password"
    else:
        grant_type = "client_credentials"
    return grant_type
