"""OAuth authorize requests with a per-request CSPRNG state."""

import secrets

import requests

AUTHORIZE_URL = "https://idp.example.com/authorize"


def build_params():
    # ok: auth.py.oauth.static-state -- state generated fresh per request
    state = secrets.token_urlsafe(32)
    params = {
        "response_type": "code",
        "client_id": "my-client",
        "state": state,
    }
    return requests.get(AUTHORIZE_URL, params=params), state


def inline_authorize_url(state: str):
    # ok: auth.py.oauth.static-state -- dynamic state interpolated via f-string
    return f"https://idp.example.com/authorize?response_type=code&client_id=abc&state={state}"


def unrelated_state_field():
    # ok: auth.py.oauth.static-state -- a literal "state" with no response_type is not an authorize request
    return {"state": "CA", "city": "San Francisco"}
