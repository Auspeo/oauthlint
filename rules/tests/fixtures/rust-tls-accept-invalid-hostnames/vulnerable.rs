use reqwest::Client;

fn build_insecure() -> Client {
    // ruleid: auth.rust.tls.accept-invalid-hostnames
    reqwest::Client::builder()
        .danger_accept_invalid_hostnames(true)
        .build()
        .unwrap()
}

fn build_insecure_inline() -> Client {
    let builder = reqwest::Client::builder().timeout(std::time::Duration::from_secs(30));
    // ruleid: auth.rust.tls.accept-invalid-hostnames
    builder.danger_accept_invalid_hostnames(true).build().unwrap()
}
