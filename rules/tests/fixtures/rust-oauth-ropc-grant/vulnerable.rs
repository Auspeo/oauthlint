use oauth2::basic::BasicClient;
use oauth2::{ResourceOwnerPassword, ResourceOwnerUsername};
use reqwest::Client;

// oauth2 crate ROPC helper — the password grant.
async fn login_oauth2(client: &BasicClient, username: &str, password: &str) {
    let http = reqwest::Client::new();
    // ruleid: auth.rust.oauth.ropc-grant
    let _ = client
        .exchange_password(
            &ResourceOwnerUsername::new(username.to_string()),
            &ResourceOwnerPassword::new(password.to_string()),
        )
        .request_async(&http)
        .await;
}

// Hand-built reqwest form carrying the password grant.
async fn login_form(client: &Client, username: &str, password: &str) {
    // ruleid: auth.rust.oauth.ropc-grant
    let params = [
        ("grant_type", "password"),
        ("username", username),
        ("password", password),
    ];
    let _ = client
        .post("https://issuer.example.com/oauth/token")
        .form(&params)
        .send()
        .await;
}

// URL-encoded body string built by hand.
async fn login_raw_body(client: &Client, username: &str) {
    // ruleid: auth.rust.oauth.ropc-grant
    let body = format!("grant_type=password&username={}", username);
    let _ = client
        .post("https://issuer.example.com/oauth/token")
        .body(body)
        .send()
        .await;
}

fn main() {}
