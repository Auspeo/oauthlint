from authlib.integrations.requests_client import OAuth2Session

def make_client():
    # ruleid: auth.py.oauth.hardcoded-client-secret
    session = OAuth2Session("my-client-id", "s3cr3t-client-value", scope="openid")
    return session

def register(oauth):
    # ruleid: auth.py.oauth.hardcoded-client-secret
    oauth.register(name="google", client_id="abc", client_secret="hardcoded-secret-xyz")
