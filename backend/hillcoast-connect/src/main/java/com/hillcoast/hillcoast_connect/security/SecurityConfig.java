package com.hillcoast.hillcoast_connect.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Enable CORS using our custom source bean below and disable CSRF for stateless APIs
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            
            // 2. Enforce fully stateless token validation management
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 3. Configure HTTP Request matching authorization paths
            .authorizeHttpRequests(auth -> auth
                // Public endpoints that don't need authentication evaluation
                .requestMatchers("/api/auth/**").permitAll()
                
                // FIXED: Authorize spatial mapping, geofencing, and order streams for any authenticated profile
                .requestMatchers("/api/products/**").authenticated() 
                .requestMatchers("/api/orders/**").authenticated()
                .requestMatchers("/api/analytics/**").authenticated() 
                
                // Standard strict role-based sub-route blocks
                .requestMatchers("/api/producer/**").hasAnyRole("PRODUCER")
                .requestMatchers("/api/customer/**").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN")
                
                // Any other traffic requires basic token verification
                .anyRequest().authenticated()
            );

        // 4. Register the custom JWT authorization processing filter ahead of standard form verification
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Dynamic origin array matching your multi-host configuration
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000", 
            "http://127.0.0.1:3000", 
            "http://192.168.56.1:3000"
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}