import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    // Spring Security 6 lambda DSL: actuator opened to anonymous access.
    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all-actuator
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/**").permitAll()
            .anyRequest().authenticated());
        return http.build();
    }

    // Legacy antMatchers: heap dump endpoint left public.
    SecurityFilterChain legacy(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.permit-all-actuator
        http.authorizeRequests().antMatchers("/actuator/heapdump").permitAll();
        return http.build();
    }
}
