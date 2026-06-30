import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;

class SecurityConfig {

    WebSecurityCustomizer webSecurityCustomizer() {
        // ruleid: auth.java.web.security-ignoring-all
        return (web) -> web.ignoring().requestMatchers("/**");
    }

    void legacyConfigure(WebSecurity web) {
        // ruleid: auth.java.web.security-ignoring-all
        web.ignoring().antMatchers("/**");
    }
}
