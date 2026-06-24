import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfigSafe {

    // ok: auth.java.session.fixation-disabled -- session ID regenerated on login
    SecurityFilterChain changeId(HttpSecurity http) throws Exception {
        http.sessionManagement(session -> session.sessionFixation(fixation -> fixation.changeSessionId()));
        return http.build();
    }

    // ok: auth.java.session.fixation-disabled -- attributes migrated to a new session
    SecurityFilterChain migrate(HttpSecurity http) throws Exception {
        http.sessionManagement().sessionFixation().migrateSession();
        return http.build();
    }

    // ok: auth.java.session.fixation-disabled -- no session fixation config (default applies)
    SecurityFilterChain defaults(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }
}
