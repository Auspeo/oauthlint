"""Disabling oauthlib's HTTPS requirement via OAUTHLIB_INSECURE_TRANSPORT."""

import os
from os import environ

from requests_oauthlib import OAuth2Session

# ruleid: auth.py.oauth.insecure-transport-env
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

# ruleid: auth.py.oauth.insecure-transport-env
os.environ.setdefault("OAUTHLIB_INSECURE_TRANSPORT", "1")

# ruleid: auth.py.oauth.insecure-transport-env
environ["OAUTHLIB_INSECURE_TRANSPORT"] = "true"


def make_session(client_id: str):
    return OAuth2Session(client_id, redirect_uri="http://localhost/callback")
