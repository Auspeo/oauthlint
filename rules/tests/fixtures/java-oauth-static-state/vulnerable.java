class AuthorizeRequest {

    // Inline authorize URL literal carrying both response_type and a constant
    // state value.
    String build() {
        // ruleid: auth.java.oauth.static-state
        return "https://idp.example.com/authorize?response_type=code&client_id=web&state=xyz123&scope=openid";
    }

    // Constant state placed before response_type in the same literal.
    String fixed() {
        // ruleid: auth.java.oauth.static-state
        return "https://idp.example.com/oauth/authorize?state=abc&client_id=web&response_type=code";
    }
}
