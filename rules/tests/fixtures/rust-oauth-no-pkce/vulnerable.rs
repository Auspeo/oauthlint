use oauth2::basic::BasicClient;
use oauth2::{CsrfToken, Scope};

// Authorization URL built WITHOUT a PKCE challenge — an intercepted
// authorization code can be replayed by an attacker.
fn authorize_no_pkce(client: &BasicClient) {
    // ruleid: auth.rust.oauth.no-pkce
    let (auth_url, _csrf) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("read".to_string()))
        .add_scope(Scope::new("write".to_string()))
        .url();
    println!("{}", auth_url);
}

// Minimal chain, still no PKCE.
fn authorize_minimal(client: &BasicClient) {
    // ruleid: auth.rust.oauth.no-pkce
    let (auth_url, _csrf) = client.authorize_url(CsrfToken::new_random).url();
    println!("{}", auth_url);
}

fn main() {}
