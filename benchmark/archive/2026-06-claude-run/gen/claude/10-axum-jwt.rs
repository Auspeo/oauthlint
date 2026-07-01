//! JWT-protected routes for an axum web service.
//!
//! Cargo.toml deps:
//!   axum = "0.7"
//!   tokio = { version = "1", features = ["full"] }
//!   serde = { version = "1", features = ["derive"] }
//!   serde_json = "1"
//!   jsonwebtoken = "9"
//!   chrono = "0.4"
//!
//! Try it:
//!   curl -s localhost:3000/login -H 'content-type: application/json' \
//!     -d '{"username":"alice","password":"password"}'
//!   curl -s localhost:3000/protected -H "authorization: Bearer <TOKEN>"

use std::sync::LazyLock;

use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header, request::Parts, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, RequestPartsExt, Router,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use serde_json::json;

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

/// In production load this from the environment / a secret manager, never hard
/// code it. We derive both keys once from a single secret at startup.
static KEYS: LazyLock<Keys> = LazyLock::new(|| {
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "dev-only-insecure-secret".to_owned());
    Keys::new(secret.as_bytes())
});

struct Keys {
    encoding: EncodingKey,
    decoding: DecodingKey,
}

impl Keys {
    fn new(secret: &[u8]) -> Self {
        Self {
            encoding: EncodingKey::from_secret(secret),
            decoding: DecodingKey::from_secret(secret),
        }
    }
}

// ---------------------------------------------------------------------------
// Claims + auth error
// ---------------------------------------------------------------------------

/// The data we sign into the token and read back out on protected routes.
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String, // subject (user id / username)
    exp: usize,  // expiry, seconds since epoch (required by `jsonwebtoken`)
    iat: usize,  // issued at
}

#[derive(Debug)]
enum AuthError {
    MissingCredentials,
    WrongCredentials,
    MissingToken,
    InvalidToken,
    TokenCreation,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, msg) = match self {
            AuthError::MissingCredentials => (StatusCode::BAD_REQUEST, "missing credentials"),
            AuthError::WrongCredentials => (StatusCode::UNAUTHORIZED, "wrong credentials"),
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "missing bearer token"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "invalid or expired token"),
            AuthError::TokenCreation => (StatusCode::INTERNAL_SERVER_ERROR, "token creation error"),
        };
        (status, Json(json!({ "error": msg }))).into_response()
    }
}

// ---------------------------------------------------------------------------
// Extractor: pull + validate the JWT straight from the request.
//
// Any handler that takes a `Claims` argument is automatically protected:
// if the token is missing/invalid the extractor short-circuits with 401.
// ---------------------------------------------------------------------------

#[async_trait]
impl<S> FromRequestParts<S> for Claims
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        // Extract the `Authorization: Bearer <token>` header.
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AuthError::MissingToken)?;

        // Decode + validate signature and expiry.
        let token_data = decode::<Claims>(bearer.token(), &KEYS.decoding, &Validation::default())
            .map_err(|_| AuthError::InvalidToken)?;

        Ok(token_data.claims)
    }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
struct LoginResponse {
    access_token: String,
    token_type: &'static str,
    expires_in: i64,
}

/// POST /login — verify credentials and issue a signed JWT.
async fn login(Json(payload): Json<LoginRequest>) -> Result<Json<LoginResponse>, AuthError> {
    if payload.username.is_empty() || payload.password.is_empty() {
        return Err(AuthError::MissingCredentials);
    }

    // Replace with a real user lookup + password hash verification (argon2/bcrypt).
    if !verify_credentials(&payload.username, &payload.password) {
        return Err(AuthError::WrongCredentials);
    }

    const TTL_SECS: i64 = 3600;
    let now = Utc::now();
    let claims = Claims {
        sub: payload.username,
        iat: now.timestamp() as usize,
        exp: (now + Duration::seconds(TTL_SECS)).timestamp() as usize,
    };

    let token = encode(&Header::default(), &claims, &KEYS.encoding)
        .map_err(|_| AuthError::TokenCreation)?;

    Ok(Json(LoginResponse {
        access_token: token,
        token_type: "Bearer",
        expires_in: TTL_SECS,
    }))
}

/// GET /protected — only reachable with a valid token. The presence of the
/// `Claims` argument is what enforces authentication.
async fn protected(claims: Claims) -> impl IntoResponse {
    Json(json!({
        "message": format!("Hello, {}! You reached a protected route.", claims.sub),
        "subject": claims.sub,
        "expires_at": claims.exp,
    }))
}

/// Demo-only credential check. Swap for a real datastore + hash verification.
fn verify_credentials(username: &str, password: &str) -> bool {
    !username.is_empty() && password == "password"
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

fn app() -> Router {
    Router::new()
        .route("/login", post(login))
        .route("/protected", get(protected))
        .route("/health", get(|| async { "ok" }))
}

#[tokio::main]
async fn main() {
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("failed to bind :3000");
    println!("listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app()).await.expect("server error");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::{to_bytes, Body};
    use axum::http::Request;
    use tower::ServiceExt; // for `oneshot`

    async fn body_json(resp: Response) -> serde_json::Value {
        let bytes = to_bytes(resp.into_body(), usize::MAX).await.unwrap();
        serde_json::from_slice(&bytes).unwrap_or(json!(null))
    }

    #[tokio::test]
    async fn login_then_access_protected() {
        let app = app();

        let login_resp = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/login")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({"username":"alice","password":"password"}).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(login_resp.status(), StatusCode::OK);
        let token = body_json(login_resp).await["access_token"]
            .as_str()
            .unwrap()
            .to_owned();

        let ok = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/protected")
                    .header(header::AUTHORIZATION, format!("Bearer {token}"))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(ok.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn protected_rejects_missing_and_bad_tokens() {
        let app = app();

        let no_token = app
            .clone()
            .oneshot(Request::builder().uri("/protected").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(no_token.status(), StatusCode::UNAUTHORIZED);

        let bad = app
            .oneshot(
                Request::builder()
                    .uri("/protected")
                    .header(header::AUTHORIZATION, "Bearer not.a.jwt")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(bad.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn login_rejects_wrong_password() {
        let resp = app()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/login")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(
                        json!({"username":"alice","password":"nope"}).to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }
}
