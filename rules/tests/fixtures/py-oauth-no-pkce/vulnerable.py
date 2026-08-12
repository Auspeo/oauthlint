from authlib.integrations.requests_client import OAuth2Session

def login(session: OAuth2Session):
    # ruleid: auth.py.oauth.no-pkce
    uri, state = session.create_authorization_url("https://as.example.com/authorize")
    return uri
