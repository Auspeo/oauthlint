class OAuthEndpoints {

    // TLS-protected token endpoint.
    String tokenUrl() {
        // ok: auth.java.oauth.insecure-token-endpoint
        return "https://idp.example.com/oauth/token";
    }

    // TLS-protected authorize request.
    String authorizeUrl(String clientId) {
        // ok: auth.java.oauth.insecure-token-endpoint
        return "https://idp.example.com/authorize?response_type=code&client_id=" + clientId;
    }

    // True-negative trap: a cleartext http:// URL that is NOT an OAuth endpoint
    // (no OAuth marker), and a loopback dev token endpoint — neither is flagged.
    String healthUrl() {
        // ok: auth.java.oauth.insecure-token-endpoint
        return "http://status.example.com/health";
    }

    String localDevToken() {
        // ok: auth.java.oauth.insecure-token-endpoint
        return "http://localhost:8080/oauth/token";
    }

    String loopbackToken() {
        // ok: auth.java.oauth.insecure-token-endpoint
        return "http://127.0.0.1:9000/connect/token";
    }
}
