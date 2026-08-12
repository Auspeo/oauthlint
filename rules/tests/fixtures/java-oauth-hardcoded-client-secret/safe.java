import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.oauth2.client.registration.ClientRegistration;

class OAuthClients {

    @Value("${google.client-secret}")
    private String googleSecret;

    // Secret injected from a configuration property.
    ClientRegistration fromInjectedProperty() {
        // ok: auth.java.oauth.hardcoded-client-secret
        return ClientRegistration.withRegistrationId("google")
                .clientId("google-client-id")
                .clientSecret(googleSecret)
                .build();
    }

    // Secret read from the environment at build time.
    ClientRegistration fromEnv() {
        // ok: auth.java.oauth.hardcoded-client-secret
        return ClientRegistration.withRegistrationId("google")
                .clientId("google-client-id")
                .clientSecret(System.getenv("GOOGLE_CLIENT_SECRET"))
                .build();
    }

    // Secret resolved from a property placeholder / Environment.
    ClientRegistration fromEnvironment(Environment env) {
        // ok: auth.java.oauth.hardcoded-client-secret
        return ClientRegistration.withRegistrationId("google")
                .clientSecret(env.getProperty("google.client-secret"))
                .build();
    }
}
