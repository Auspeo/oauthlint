use oauth2::basic::BasicClient;
use oauth2::CsrfToken;

// Hardcoded state via .to_string() — constant on every request.
fn authorize_static(client: &BasicClient) {
    // ruleid: auth.rust.oauth.static-state
    let _ = client.authorize_url(|| CsrfToken::new("static-state-123".to_string()));
}

// Hardcoded state via String::from.
fn authorize_static_from(client: &BasicClient) {
    // ruleid: auth.rust.oauth.static-state
    let _ = client.authorize_url(|| CsrfToken::new(String::from("constant")));
}

// Hardcoded state via .into().
fn authorize_static_into(client: &BasicClient) {
    // ruleid: auth.rust.oauth.static-state
    let _ = client.authorize_url(|| CsrfToken::new("fixed".into()));
}

fn main() {}
