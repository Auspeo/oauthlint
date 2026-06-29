import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    // Management endpoints require authentication; only ordinary public routes
    // are opened.
    SecurityFilterChain secured(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all-actuator
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/**").hasRole("ADMIN")
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated());
        return http.build();
    }

    // True-negative trap: permitAll() on a normal application path that is not a
    // management/diagnostics surface.
    SecurityFilterChain publicRoute(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all-actuator
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/login").permitAll()
            .anyRequest().authenticated());
        return http.build();
    }
}
