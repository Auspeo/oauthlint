import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain secured(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all
        http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }

    SecurityFilterChain publicRoutesThenAuth(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/public/**").permitAll()
            .requestMatchers("/login").permitAll()
            .anyRequest().authenticated());
        return http.build();
    }

    SecurityFilterChain fluentSecured(HttpSecurity http) throws Exception {
        // ok: auth.java.web.permit-all
        http.authorizeHttpRequests()
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated();
        return http.build();
    }
}
