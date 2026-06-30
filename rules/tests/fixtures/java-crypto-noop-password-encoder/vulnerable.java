import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        // ruleid: auth.java.crypto.noop-password-encoder
        return NoOpPasswordEncoder.getInstance();
    }

    UserDetails user() {
        // ruleid: auth.java.crypto.noop-password-encoder
        return User.withDefaultPasswordEncoder()
            .username("admin")
            .password("admin")
            .roles("ADMIN")
            .build();
    }
}
