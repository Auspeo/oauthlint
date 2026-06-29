"""Keeping oauthlib's transport security on."""

import os

from requests_oauthlib import OAuth2Session


# ok: auth.py.oauth.insecure-transport-env -- reading the flag, not setting it
def is_insecure_allowed() -> bool:
    return os.environ.get("OAUTHLIB_INSECURE_TRANSPORT") == "1"


# ok: auth.py.oauth.insecure-transport-env -- an unrelated environment variable
os.environ["OAUTH_CLIENT_ID"] = "my-client"


def make_session(client_id: str):
    # ok: auth.py.oauth.insecure-transport-env -- https endpoints, no transport bypass
    return OAuth2Session(client_id, redirect_uri="https://app.example.com/callback")
