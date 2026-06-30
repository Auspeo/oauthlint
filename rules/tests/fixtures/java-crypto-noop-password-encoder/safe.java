import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
class SecurityConfig {

    // ok: auth.java.crypto.noop-password-encoder -- BCrypt is a proper password hasher
    @Bean
    PasswordEncoder bcryptEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ok: auth.java.crypto.noop-password-encoder -- Argon2 is a proper password hasher
    PasswordEncoder argon2Encoder() {
        return Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
    }
}
