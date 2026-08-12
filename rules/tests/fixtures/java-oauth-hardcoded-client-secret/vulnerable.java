import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.core.AuthorizationGrantType;

class OAuthClients {

    // Manual ClientRegistration with an inlined literal client secret.
    ClientRegistration google() {
        // ruleid: auth.java.oauth.hardcoded-client-secret
        return ClientRegistration.withRegistrationId("google")
                .clientId("google-client-id")
                .clientSecret("Kd8s0-h4rdC0ded-cl1ent-secret")
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .build();
    }

    // CommonOAuth2Provider builder with a literal secret.
    ClientRegistration github() {
        // ruleid: auth.java.oauth.hardcoded-client-secret
        return CommonOAuth2Provider.GITHUB.getBuilder("github")
                .clientId("github-client-id")
                .clientSecret("gh0-literal-oauth-app-secret")
                .build();
    }
}
