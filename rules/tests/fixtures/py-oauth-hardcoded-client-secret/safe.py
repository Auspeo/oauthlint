import os
from authlib.integrations.requests_client import OAuth2Session

def make_client():
    # ok: secret from the environment
    session = OAuth2Session("my-client-id", os.environ["OAUTH_CLIENT_SECRET"], scope="openid")
    return session

def register(oauth):
    # ok: secret from settings/env
    oauth.register(name="google", client_id="abc", client_secret=os.getenv("GOOGLE_SECRET"))
