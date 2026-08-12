use oauth2::basic::BasicClient;
use oauth2::{CsrfToken, PkceCodeChallenge, Scope};

// Safe: PKCE challenge is chained into the authorize_url builder.
fn authorize_with_pkce(client: &BasicClient) {
    let (pkce_challenge, _pkce_verifier) = PkceCodeChallenge::new_random_sha256();
    // ok: auth.rust.oauth.no-pkce
    let (auth_url, _csrf) = client
        .authorize_url(CsrfToken::new_random)
        .add_scope(Scope::new("read".to_string()))
        .set_pkce_challenge(pkce_challenge)
        .url();
    println!("{}", auth_url);
}

// Safe: PKCE challenge chained directly, minimal builder.
fn authorize_with_pkce_minimal(client: &BasicClient) {
    let (pkce_challenge, _pkce_verifier) = PkceCodeChallenge::new_random_sha256();
    // ok: auth.rust.oauth.no-pkce
    let (auth_url, _csrf) = client
        .authorize_url(CsrfToken::new_random)
        .set_pkce_challenge(pkce_challenge)
        .url();
    println!("{}", auth_url);
}

fn main() {}
