"""OAuth token exchange with TLS verification disabled."""

from authlib.integrations.requests_client import OAuth2Session, OAuth1Session

TOKEN_URL = "https://idp.example.com/oauth/token"


def fetch(client_id: str, client_secret: str, code: str):
    client = OAuth2Session(client_id, client_secret)
    # ruleid: auth.py.oauth.token-request-verify-disabled
    return client.fetch_token(TOKEN_URL, code=code, verify=False)


def refresh(client, rt: str):
    # ruleid: auth.py.oauth.token-request-verify-disabled
    return client.refresh_token(TOKEN_URL, refresh_token=rt, verify=False)


def oauth1_access(client_id: str, client_secret: str):
    client = OAuth1Session(client_id, client_secret)
    # ruleid: auth.py.oauth.token-request-verify-disabled
    return client.fetch_access_token("https://idp.example.com/access_token", verify=False)
