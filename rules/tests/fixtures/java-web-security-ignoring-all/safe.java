import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

class SecurityConfig {

    // ok: auth.java.web.security-ignoring-all -- scoped static assets, not the "/**" wildcard
    WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring().requestMatchers("/css/**", "/js/**");
    }

    // ok: auth.java.web.security-ignoring-all -- scoped static assets in the legacy API
    void legacyConfigure(WebSecurity web) {
        web.ignoring().antMatchers("/images/**", "/webjars/**");
    }
}
