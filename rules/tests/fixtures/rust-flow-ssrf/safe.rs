// Outbound HTTP requests that are NOT SSRF — must produce zero findings.

fn is_allowed_url(url: &str) -> bool {
    url.starts_with("https://api.internal.example.com/")
}

const ALLOWED_URLS: [&str; 1] = ["https://api.internal.example.com/health"];

// Safe: a constant, attacker-uncontrolled target (a local, not a parameter).
async fn fetch_constant(client: reqwest::Client) -> String {
    let url = "https://api.internal.example.com/health".to_string();
    // ok: auth.rust.flow.ssrf
    client.get(url).send().await.unwrap().text().await.unwrap()
}

// Safe: the parameter is only requested inside an allow-list host-validation
// guard, which clears the taint.
async fn fetch_validated(target: String, client: reqwest::Client) -> String {
    if is_allowed_url(&target) {
        // ok: auth.rust.flow.ssrf
        return client.get(target).send().await.unwrap().text().await.unwrap();
    }
    "rejected".to_string()
}

// Safe: explicit allow-list membership guard on the exact value used.
async fn fetch_guarded(endpoint: String, client: reqwest::Client) -> String {
    if ALLOWED_URLS.contains(&endpoint.as_str()) {
        // ok: auth.rust.flow.ssrf
        return client.get(endpoint).send().await.unwrap().text().await.unwrap();
    }
    "rejected".to_string()
}
