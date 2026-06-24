use actix_cors::Cors;
use tower_http::cors::CorsLayer;

// ok: auth.rust.cors.permissive -- actix: explicit trusted origin allowlist
fn actix_allowlist() -> Cors {
    Cors::default()
        .allowed_origin("https://app.example.com")
        .allowed_origin("https://admin.example.com")
}

// ok: auth.rust.cors.permissive -- tower-http: single explicit origin
fn tower_single_origin() -> CorsLayer {
    CorsLayer::new().allow_origin("https://app.example.com".parse().unwrap())
}

// ok: auth.rust.cors.permissive -- tower-http: explicit list of origins
fn tower_origin_list() -> CorsLayer {
    CorsLayer::new().allow_origin([
        "https://app.example.com".parse().unwrap(),
        "https://admin.example.com".parse().unwrap(),
    ])
}
