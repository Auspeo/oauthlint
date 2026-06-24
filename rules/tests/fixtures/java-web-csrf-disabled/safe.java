import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

class SecurityConfigSafe {

    // ok: auth.java.web.csrf-disabled -- CSRF left enabled (default)
    SecurityFilterChain enabled(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }

    // ok: auth.java.web.csrf-disabled -- CSRF kept on with a cookie token repository
    SecurityFilterChain cookieRepo(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));
        return http.build();
    }
}
