class OAuthEndpoints {

    // Token endpoint over cleartext http://.
    String tokenUrl() {
        // ruleid: auth.java.oauth.insecure-token-endpoint
        return "http://idp.example.com/oauth/token";
    }

    // Authorize request carrying response_type over http://.
    String authorizeUrl(String clientId, String state) {
        // ruleid: auth.java.oauth.insecure-token-endpoint
        return "http://idp.example.com/authorize?response_type=code&client_id=" + clientId
            + "&state=" + state;
    }

    // OIDC connect/token endpoint over http://.
    String introspect() {
        // ruleid: auth.java.oauth.insecure-token-endpoint
        return "http://login.example.com/connect/token";
    }
}
