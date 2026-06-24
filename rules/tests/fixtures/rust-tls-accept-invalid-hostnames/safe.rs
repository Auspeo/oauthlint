use reqwest::Client;

// ok: auth.rust.tls.accept-invalid-hostnames -- verification left on (default)
fn build_default() -> Client {
    reqwest::Client::builder().build().unwrap()
}

// ok: auth.rust.tls.accept-invalid-hostnames -- explicitly false
fn build_explicit_false() -> Client {
    reqwest::Client::builder()
        .danger_accept_invalid_hostnames(false)
        .build()
        .unwrap()
}

// ok: auth.rust.tls.accept-invalid-hostnames -- private CA added explicitly, not skipping
fn build_with_ca(cert: reqwest::Certificate) -> Client {
    reqwest::Client::builder()
        .add_root_certificate(cert)
        .build()
        .unwrap()
}
