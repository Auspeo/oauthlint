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
