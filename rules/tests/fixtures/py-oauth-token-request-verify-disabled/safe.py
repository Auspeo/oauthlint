"""OAuth token exchange that keeps TLS verification on."""

from authlib.integrations.requests_client import OAuth2Session

TOKEN_URL = "https://idp.example.com/oauth/token"
CA_BUNDLE = "/etc/ssl/certs/internal-ca.pem"


def fetch(client_id: str, client_secret: str, code: str):
    client = OAuth2Session(client_id, client_secret)
    # ok: auth.py.oauth.token-request-verify-disabled -- verification left on (default)
    return client.fetch_token(TOKEN_URL, code=code)


def fetch_explicit(client_id: str, client_secret: str, code: str):
    client = OAuth2Session(client_id, client_secret)
    # ok: auth.py.oauth.token-request-verify-disabled -- verification explicitly on
    return client.fetch_token(TOKEN_URL, code=code, verify=True)


def fetch_private_ca(client_id: str, client_secret: str, code: str):
    client = OAuth2Session(client_id, client_secret)
    # ok: auth.py.oauth.token-request-verify-disabled -- pinned to a private CA bundle
    return client.fetch_token(TOKEN_URL, code=code, verify=CA_BUNDLE)
