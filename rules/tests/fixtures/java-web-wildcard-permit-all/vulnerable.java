import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain lambda(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.wildcard-permit-all
        http.authorizeHttpRequests(auth -> auth.requestMatchers("/**").permitAll());
        return http.build();
    }

    SecurityFilterChain legacyAnt(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.wildcard-permit-all
        http.authorizeRequests().antMatchers("/**").permitAll();
        return http.build();
    }

    SecurityFilterChain legacyMvc(HttpSecurity http) throws Exception {
        // ruleid: auth.java.web.wildcard-permit-all
        http.authorizeRequests().mvcMatchers("/**").permitAll();
        return http.build();
    }
}
