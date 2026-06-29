use oauth2::{AuthUrl, TokenUrl};

// Safe: every OAuth endpoint uses https://.
fn secure_endpoints() -> (AuthUrl, TokenUrl) {
    // ok: auth.rust.oauth.insecure-token-endpoint
    let auth = AuthUrl::new("https://issuer.example.com/oauth/authorize".to_string()).unwrap();
    let token = TokenUrl::new("https://issuer.example.com/oauth/token".to_string()).unwrap();
    (auth, token)
}

// Safe: localhost over http is allowed for local development.
fn local_dev_token() -> TokenUrl {
    // ok: auth.rust.oauth.insecure-token-endpoint
    TokenUrl::new("http://localhost:8080/oauth/token".to_string()).unwrap()
}

// Safe trap: a generic cleartext http URL with no OAuth marker must not fire.
fn health_url() -> &'static str {
    // ok: auth.rust.oauth.insecure-token-endpoint
    "http://issuer.example.com/healthz"
}

fn main() {}
