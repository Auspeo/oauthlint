"""OAuth/OIDC endpoints contacted over cleartext http://."""

import requests

# ruleid: auth.py.oauth.insecure-token-endpoint
TOKEN_URL = "http://idp.example.com/oauth/token"

# ruleid: auth.py.oauth.insecure-token-endpoint
AUTHORIZE_URL = "http://idp.example.com/authorize?response_type=code&client_id=abc123"

# ruleid: auth.py.oauth.insecure-token-endpoint
CONNECT_TOKEN = "http://login.example.com/connect/token"

# ruleid: auth.py.oauth.insecure-token-endpoint
DISCOVERY = "http://idp.example.com/.well-known/openid-configuration"


def fetch_token(code: str):
    # ruleid: auth.py.oauth.insecure-token-endpoint
    return requests.post("http://auth.example.com/oauth2/token", data={"grant_type": "authorization_code", "code": code})
