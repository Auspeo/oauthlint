use oauth2::{AuthUrl, TokenUrl};

// oauth2 crate endpoints configured over cleartext http://.
fn insecure_endpoints() -> (AuthUrl, TokenUrl) {
    // ruleid: auth.rust.oauth.insecure-token-endpoint
    let auth = AuthUrl::new("http://issuer.example.com/oauth/authorize".to_string()).unwrap();
    // ruleid: auth.rust.oauth.insecure-token-endpoint
    let token = TokenUrl::new("http://issuer.example.com/oauth/token".to_string()).unwrap();
    (auth, token)
}

// A hand-built authorize URL over http with OAuth query markers.
fn insecure_authorize_url() -> &'static str {
    // ruleid: auth.rust.oauth.insecure-token-endpoint
    "http://issuer.example.com/auth?response_type=code&client_id=app"
}

fn main() {}
