use oauth2::basic::BasicClient;
use oauth2::CsrfToken;

// Safe: a fresh per-request CSPRNG-backed state.
fn authorize_random(client: &BasicClient) {
    // ok: auth.rust.oauth.static-state
    let _ = client.authorize_url(CsrfToken::new_random);
}

// helper that derives a state value at runtime
fn derive_state(session_id: &str) -> String {
    format!("{}-{}", session_id, "nonce")
}

// Safe trap: the argument is a function call (with its own string literal
// inside), not a literal state — the precise literal-only patterns must not
// match it.
fn authorize_derived(client: &BasicClient, session_id: &str) {
    let state = derive_state(session_id);
    // ok: auth.rust.oauth.static-state
    let _ = client.authorize_url(|| CsrfToken::new(state.clone()));
}

fn main() {}
