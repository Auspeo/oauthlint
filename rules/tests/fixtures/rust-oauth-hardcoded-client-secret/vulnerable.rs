use oauth2::basic::BasicClient;
use oauth2::{ClientId, ClientSecret};

// Client secret hardcoded as a string literal — one grep away from compromise.
fn build_client_to_string() -> BasicClient {
    // ruleid: auth.rust.oauth.hardcoded-client-secret
    BasicClient::new(ClientId::new("my_client_id".to_string()))
        .set_client_secret(ClientSecret::new("s3cr3t-abcdef-123456".to_string()))
}

// Hardcoded via .to_owned().
fn build_client_to_owned() {
    // ruleid: auth.rust.oauth.hardcoded-client-secret
    let _ = ClientSecret::new("s3cr3t-abcdef-123456".to_owned());
}

// Hardcoded via String::from.
fn build_client_string_from() {
    // ruleid: auth.rust.oauth.hardcoded-client-secret
    let _ = ClientSecret::new(String::from("s3cr3t-abcdef-123456"));
}

// Hardcoded via .into().
fn build_client_into() {
    // ruleid: auth.rust.oauth.hardcoded-client-secret
    let _ = ClientSecret::new("s3cr3t-abcdef-123456".into());
}

fn main() {}
