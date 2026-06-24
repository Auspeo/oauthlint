use reqwest::Client;

// ok: auth.rust.tls.accept-invalid-certs -- validation left on (default)
fn build_default() -> Client {
    reqwest::Client::builder().build().unwrap()
}

// ok: auth.rust.tls.accept-invalid-certs -- explicitly false
fn build_explicit_false() -> Client {
    reqwest::Client::builder()
        .danger_accept_invalid_certs(false)
        .build()
        .unwrap()
}

// ok: auth.rust.tls.accept-invalid-certs -- private CA added explicitly, not skipping
fn build_with_ca(cert: reqwest::Certificate) -> Client {
    reqwest::Client::builder()
        .add_root_certificate(cert)
        .build()
        .unwrap()
}
