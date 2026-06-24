use actix_cors::Cors;
use tower_http::cors::{Any, CorsLayer};

// actix-web: fully permissive CORS.
fn actix_cors() -> Cors {
    // ruleid: auth.rust.cors.permissive
    Cors::permissive()
}

// tower-http: permissive layer allows any origin, method, and header.
fn tower_permissive() -> CorsLayer {
    // ruleid: auth.rust.cors.permissive
    CorsLayer::permissive()
}

// tower-http: explicit wide-open origin.
fn tower_any_origin() -> CorsLayer {
    // ruleid: auth.rust.cors.permissive
    CorsLayer::new().allow_origin(Any)
}
