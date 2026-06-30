import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

    SecurityFilterChain scoped(HttpSecurity http) throws Exception {
        // ok: auth.java.web.wildcard-permit-all -- scoped public path, then authenticate the rest
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/public/**").permitAll()
            .anyRequest().authenticated());
        return http.build();
    }

    SecurityFilterChain scopedLegacy(HttpSecurity http) throws Exception {
        // ok: auth.java.web.wildcard-permit-all -- scoped asset path is not the "/**" wildcard
        http.authorizeRequests()
            .antMatchers("/assets/**").permitAll()
            .anyRequest().authenticated();
        return http.build();
    }
}
