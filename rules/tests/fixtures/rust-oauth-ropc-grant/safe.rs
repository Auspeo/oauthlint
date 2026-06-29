use oauth2::basic::BasicClient;
use oauth2::AuthorizationCode;
use reqwest::Client;

// Safe: authorization-code exchange — the recommended user-login flow.
async fn login_auth_code(client: &BasicClient, code: String) {
    let http = reqwest::Client::new();
    // ok: auth.rust.oauth.ropc-grant
    let _ = client
        .exchange_code(AuthorizationCode::new(code))
        .request_async(&http)
        .await;
}

// Safe: client-credentials grant — a different grant_type value must not match.
async fn login_client_creds(client: &Client) {
    // ok: auth.rust.oauth.ropc-grant
    let params = [("grant_type", "client_credentials"), ("client_id", "svc")];
    let _ = client
        .post("https://issuer.example.com/oauth/token")
        .form(&params)
        .send()
        .await;
}

// Safe trap: a password-reset body whose grant_type prefix-matches
// "password" but is a distinct, bounded value.
async fn reset_password(client: &Client) {
    // ok: auth.rust.oauth.ropc-grant
    let body = "grant_type=password_reset&email=user@example.com";
    let _ = client
        .post("https://issuer.example.com/reset")
        .body(body)
        .send()
        .await;
}

fn main() {}
