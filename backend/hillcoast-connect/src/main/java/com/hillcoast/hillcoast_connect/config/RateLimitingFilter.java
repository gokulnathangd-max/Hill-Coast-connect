package com.hillcoast.hillcoast_connect.config;

import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Thread-safe map storing an isolated token bucket per client IP address
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket createNewBucket() {
    // Modernized Bucket4j 8.x syntax to remove deprecation warnings cleanly
    return Bucket.builder()
            .addLimit(limit -> limit.capacity(60).refillIntervally(60, Duration.ofMinutes(1)))
            .build();
}

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        // 1. Bypass HTTP OPTIONS pre-flight handshake requests completely to prevent CORS blocks
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Identify client by their network remote IP signature
        String ip = request.getRemoteAddr();
        Bucket bucket = cache.computeIfAbsent(ip, k -> createNewBucket());

        // 3. Atomically evaluate token extraction
        if (bucket.tryConsume(1)) {
            // Token available; pass request further down the filter chain
            filterChain.doFilter(request, response);
        } else {
            // Bucket empty; short-circuit pipeline and return defensive JSON layout
            response.setStatus(429); // 429 Too Many Requests
            response.setContentType("application/json;charset=UTF-8");
            
            // Fallback CORS headers to ensure browsers allow reading the payload during a rate-limit event
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            
            String errorPayload = "{"
                    + "\"error\": \"Too Many Requests\","
                    + "\"message\": \"Rate limit exceeded. Shielding system endpoints. Please wait before retrying.\""
                    + "}";
            response.getWriter().write(errorPayload);
        }
    }
}