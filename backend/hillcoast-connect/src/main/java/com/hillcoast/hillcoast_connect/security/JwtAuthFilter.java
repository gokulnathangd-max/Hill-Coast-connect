package com.hillcoast.hillcoast_connect.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Bypass token evaluation entirely for authentication endpoints and CORS preflights
        return path.startsWith("/api/auth/") || request.getMethod().equalsIgnoreCase("OPTIONS");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        // 1. Verify the format of the incoming authorization header before parsing
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
            try {
                username = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                logger.error("JWT Token parsing extraction failure: " + e.getMessage());
            }
        }

        // 2. If a valid username is found and the security execution context context is clear, evaluate credentials
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            if (jwtUtil.validateToken(token)) {
                // Extract role parameter embedded in the JWT payload claims matrix
                String role = jwtUtil.extractRole(token);
                
                // Enforce the standard Spring Security prefix matching convention
                String roleWithPrefix = (role != null && !role.startsWith("ROLE_")) ? "ROLE_" + role : role;
                
                if (roleWithPrefix != null) {
                    List<SimpleGrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(roleWithPrefix));

                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(username, null, authorities);

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    
                    // Inject the fully built token context into the central security thread holder
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        }

        // Forward the request context down the filter chain processing line
        filterChain.doFilter(request, response);
    }
}