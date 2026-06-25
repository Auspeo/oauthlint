package com.example.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Stateless JWT bearer-token security for a REST API backing an SPA.
 *
 * <p>All pieces live in this single file for easy drop-in. In a real project you'd
 * split these into separate classes/packages.
 *
 * <p>Required config (application.yml / env):
 * <pre>
 *   app.jwt.secret: a base64 or raw secret of at least 32 bytes (256 bits) for HS256
 *   app.jwt.expiration-ms: 3600000   # 1 hour
 * </pre>
 */
@Configuration
public class SecurityConfig {

    /**
     * The core security filter chain: stateless, no CSRF (token-based, not cookie-based),
     * CORS enabled for the SPA, and a JWT filter that authenticates every request.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                    JwtAuthenticationFilter jwtFilter) throws Exception {
        http
            // SPA + bearer tokens => no server-side session, no CSRF token dance.
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints: login, registration, health, CORS preflight.
                .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
                // Everything else needs a valid JWT.
                .anyRequest().authenticated()
            )
            // Return 401/403 as JSON-ish status codes instead of redirecting to a login page.
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) ->
                    res.sendError(HttpStatus.UNAUTHORIZED.value(), "Unauthorized"))
                .accessDeniedHandler((req, res, e) ->
                    res.sendError(HttpStatus.FORBIDDEN.value(), "Forbidden"))
            )
            // Run our JWT filter before the username/password filter so the
            // SecurityContext is populated for downstream authorization checks.
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            // No basic/form login — the SPA only ever sends bearer tokens.
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }

    /** CORS settings for the separately-hosted SPA. Tighten origins for production. */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5173}") List<String> allowedOrigins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** Exposed so the login controller can authenticate username/password credentials. */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    // ---------------------------------------------------------------------
    // JWT service: issue + parse/validate tokens.
    // ---------------------------------------------------------------------

    /**
     * Issues and validates HS256 JWTs. The login flow calls {@link #generateToken},
     * the filter calls {@link #parseToken}.
     */
    @Component
    public static class JwtService {

        private final SecretKey key;
        private final long expirationMs;

        public JwtService(@Value("${app.jwt.secret}") String secret,
                          @Value("${app.jwt.expiration-ms:3600000}") long expirationMs) {
            // hmacShaKeyFor requires >= 256 bits for HS256.
            this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            this.expirationMs = expirationMs;
        }

        /**
         * Issue a signed JWT for an authenticated user. Subject = username,
         * roles carried as a custom claim for stateless authorization.
         */
        public String generateToken(String username, List<String> roles) {
            Date now = new Date();
            Date expiry = new Date(now.getTime() + expirationMs);
            return Jwts.builder()
                    .subject(username)
                    .claim("roles", roles)
                    .issuedAt(now)
                    .expiration(expiry)
                    .signWith(key)
                    .compact();
        }

        /** Convenience overload that pulls username + authorities off an Authentication. */
        public String generateToken(Authentication authentication) {
            List<String> roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();
            String username = authentication.getName();
            return generateToken(username, roles);
        }

        /** Parse and validate; throws {@link JwtException} if signature/expiry is bad. */
        public Claims parseToken(String token) {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        }
    }

    // ---------------------------------------------------------------------
    // JWT filter: reads the bearer token and populates the SecurityContext.
    // ---------------------------------------------------------------------

    @Component
    public static class JwtAuthenticationFilter extends OncePerRequestFilter {

        private static final String HEADER = "Authorization";
        private static final String PREFIX = "Bearer ";

        private final JwtService jwtService;

        public JwtAuthenticationFilter(JwtService jwtService) {
            this.jwtService = jwtService;
        }

        @Override
        @SuppressWarnings("unchecked")
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain filterChain)
                throws ServletException, IOException {

            String token = resolveToken(request);
            if (token != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                try {
                    Claims claims = jwtService.parseToken(token);
                    String username = claims.getSubject();

                    List<String> roles = claims.get("roles", List.class);
                    List<SimpleGrantedAuthority> authorities = (roles == null ? List.<String>of() : roles)
                            .stream()
                            .map(SimpleGrantedAuthority::new)
                            .toList();

                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (JwtException | IllegalArgumentException ex) {
                    // Invalid/expired token: leave context empty -> request stays anonymous,
                    // and the entry point will reject protected endpoints with 401.
                    SecurityContextHolder.clearContext();
                }
            }

            filterChain.doFilter(request, response);
        }

        private String resolveToken(HttpServletRequest request) {
            String header = request.getHeader(HEADER);
            if (header != null && header.startsWith(PREFIX)) {
                return header.substring(PREFIX.length()).trim();
            }
            return null;
        }
    }
}

// -------------------------------------------------------------------------
// Example login controller showing how the helper issues a token. Drop into
// its own file in a real app; kept here so the feature is self-contained.
// -------------------------------------------------------------------------
//
// @RestController
// @RequestMapping("/api/auth")
// class AuthController {
//
//     private final AuthenticationManager authenticationManager;
//     private final SecurityConfig.JwtService jwtService;
//
//     AuthController(AuthenticationManager am, SecurityConfig.JwtService jwt) {
//         this.authenticationManager = am;
//         this.jwtService = jwt;
//     }
//
//     record LoginRequest(String username, String password) {}
//     record TokenResponse(String accessToken, String tokenType) {}
//
//     @PostMapping("/login")
//     TokenResponse login(@RequestBody LoginRequest req) {
//         Authentication auth = authenticationManager.authenticate(
//                 new UsernamePasswordAuthenticationToken(req.username(), req.password()));
//         String token = jwtService.generateToken(auth);
//         return new TokenResponse(token, "Bearer");
//     }
// }
