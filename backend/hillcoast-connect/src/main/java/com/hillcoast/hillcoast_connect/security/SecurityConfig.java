package com.hillcoast.hillcoast_connect.security;

import com.hillcoast.hillcoast_connect.config.RateLimitingFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitingFilter rateLimitingFilter;

    // Injecting both filters safely via constructor injection
    public SecurityConfig(JwtAuthFilter jwtAuthFilter, RateLimitingFilter rateLimitingFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.rateLimitingFilter = rateLimitingFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Activate custom CORS rules configured below
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // 2. Disable CSRF since we handle session access token logic statelessly via JWT
            .csrf(csrf -> csrf.disable()) 
            
            // 3. Configure HTTP Request Security Mapping Rules
            .authorizeHttpRequests(auth -> auth
                // Permit all browser cross-origin preflight OPTIONS handshakes globally
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Public authentication routing entry paths
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/products/nearby").permitAll()
                
                // Protect core asset telemetry endpoints - requires a valid Bearer token sequence
                .requestMatchers("/api/products", "/api/products/**").authenticated() 
                
                // Any other unmapped system path requires basic authentication context
                .anyRequest().authenticated()
            )
            
            // 4. Force Spring Security to maintain a completely Stateless Session Strategy
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
            
        // 5. CRITICAL FIX: Establish strict chaining order using standard filter references
        http.addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(jwtAuthFilter, RateLimitingFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Explicitly white-list both local development setups and your network area interfaces
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://192.168.56.1:3000"));
        
        // Authorize all core REST API interaction verbs used by Axios
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // Pass essential headers explicitly to prevent security filters from dropping custom token payloads
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control"));
        
        // Allow tracking credentials across the communication ports
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}