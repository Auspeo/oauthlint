use reqwest::Client;

fn build_insecure() -> Client {
    // ruleid: auth.rust.tls.accept-invalid-certs
    reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .unwrap()
}

fn build_insecure_inline() -> Client {
    let builder = reqwest::Client::builder().timeout(std::time::Duration::from_secs(30));
    // ruleid: auth.rust.tls.accept-invalid-certs
    builder.danger_accept_invalid_certs(true).build().unwrap()
}
