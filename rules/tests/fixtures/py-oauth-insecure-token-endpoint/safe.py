"""OAuth/OIDC endpoints over TLS, plus loopback dev hosts that are exempt."""

import requests

# ok: auth.py.oauth.insecure-token-endpoint -- TLS, the requirement
TOKEN_URL = "https://idp.example.com/oauth/token"

# ok: auth.py.oauth.insecure-token-endpoint -- TLS authorize endpoint
AUTHORIZE_URL = "https://idp.example.com/authorize?response_type=code&client_id=abc123"

# ok: auth.py.oauth.insecure-token-endpoint -- localhost dev host is exempt
LOCAL_TOKEN = "http://localhost:8080/oauth/token"

# ok: auth.py.oauth.insecure-token-endpoint -- loopback dev host is exempt
LOOPBACK = "http://127.0.0.1:9000/connect/token"

# ok: auth.py.oauth.insecure-token-endpoint -- plain http URL with no OAuth marker
HEALTHCHECK = "http://idp.example.com/healthz"


def fetch_token(code: str):
    # ok: auth.py.oauth.insecure-token-endpoint -- TLS token exchange
    return requests.post(TOKEN_URL, data={"grant_type": "authorization_code", "code": code})
