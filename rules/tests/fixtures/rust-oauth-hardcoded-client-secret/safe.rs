use oauth2::basic::BasicClient;
use oauth2::{ClientId, ClientSecret};

// Safe: secret loaded from the environment at runtime.
fn build_client_from_env() -> Result<(), Box<dyn std::error::Error>> {
    let secret = std::env::var("OAUTH_CLIENT_SECRET")?;
    // ok: auth.rust.oauth.hardcoded-client-secret
    let _ = ClientSecret::new(secret);
    Ok(())
}

// Safe: env var read inline and converted, still not a literal.
fn build_client_inline_env() -> Result<(), Box<dyn std::error::Error>> {
    // ok: auth.rust.oauth.hardcoded-client-secret
    let _ = ClientSecret::new(std::env::var("OAUTH_CLIENT_SECRET")?);
    Ok(())
}

// Safe: derived from a variable, not a string literal.
fn build_client_from_var(secret: String) {
    // ok: auth.rust.oauth.hardcoded-client-secret
    let _ = ClientSecret::new(secret);
}

fn main() {}
