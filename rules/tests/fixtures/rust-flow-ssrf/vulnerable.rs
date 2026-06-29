use axum::extract::{Path, Query};
use std::collections::HashMap;

// Inline: a handler `String` parameter flows straight into reqwest::get.
async fn fetch(url: String) -> String {
    // ruleid: auth.rust.flow.ssrf
    reqwest::get(url).await.unwrap().text().await.unwrap()
}

// Indirection: the parameter is assigned to a local, then requested via a
// client. Taint tracks through the binding.
async fn proxy(target: String, client: reqwest::Client) -> String {
    let dest = target;
    // ruleid: auth.rust.flow.ssrf
    client.get(dest).send().await.unwrap().text().await.unwrap()
}

// POST against a request-derived URL.
async fn relay(endpoint: String, client: reqwest::Client) {
    // ruleid: auth.rust.flow.ssrf
    let _ = client.post(endpoint).send().await;
}

// axum Query extractor destructured to a struct, the inner field flows out.
async fn from_query(Query(params): Query<HashMap<String, String>>) -> String {
    let url = params.get("url").cloned().unwrap_or_default();
    // ruleid: auth.rust.flow.ssrf
    reqwest::get(url).await.unwrap().text().await.unwrap()
}

// axum Path extractor parameter into a blocking client request.
async fn from_path(Path(host): Path<String>, client: reqwest::Client) {
    // ruleid: auth.rust.flow.ssrf
    let _ = client.head(host).send().await;
}
