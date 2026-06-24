import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfigSafe {

    // ok: auth.java.web.frame-options-disabled -- frame options left at default (DENY)
    SecurityFilterChain defaults(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }

    // ok: auth.java.web.frame-options-disabled -- explicitly kept on with SAMEORIGIN
    SecurityFilterChain sameOrigin(HttpSecurity http) throws Exception {
        http.headers(h -> h.frameOptions(f -> f.sameOrigin()));
        return http.build();
    }

    // ok: auth.java.web.frame-options-disabled -- explicitly kept on with DENY
    SecurityFilterChain deny(HttpSecurity http) throws Exception {
        http.headers(h -> h.frameOptions(f -> f.deny()));
        return http.build();
    }
}
