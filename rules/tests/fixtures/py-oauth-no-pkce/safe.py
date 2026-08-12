from authlib.common.security import generate_token
from authlib.integrations.requests_client import OAuth2Session

def login(session: OAuth2Session):
    verifier = generate_token(48)
    # ok: PKCE code_verifier supplied (Authlib derives the S256 challenge)
    uri, state = session.create_authorization_url(
        "https://as.example.com/authorize", code_verifier=verifier
    )
    return uri
