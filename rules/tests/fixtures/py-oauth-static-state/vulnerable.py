"""OAuth authorize requests with a hardcoded, constant state value."""

import requests

AUTHORIZE_URL = "https://idp.example.com/authorize"


def build_params():
    # ruleid: auth.py.oauth.static-state
    params = {
        "response_type": "code",
        "client_id": "my-client",
        "redirect_uri": "https://app.example.com/callback",
        "state": "static-state-123",
    }
    return requests.get(AUTHORIZE_URL, params=params)


def inline_authorize_url():
    # ruleid: auth.py.oauth.static-state
    return "https://idp.example.com/authorize?response_type=code&client_id=abc&state=fixed123"
