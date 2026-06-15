package com.hillcoast.hillcoast_connect.controller;

import com.hillcoast.hillcoast_connect.model.Product;
import com.hillcoast.hillcoast_connect.model.User;
import com.hillcoast.hillcoast_connect.repository.ProductRepository;
import com.hillcoast.hillcoast_connect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://192.168.56.1:3000"}, allowCredentials = "true")
public class ProductController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ProductController(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    /**
     * Maps to: GET http://localhost:8080/api/products
     */
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    /**
     * Maps to: GET http://localhost:8080/api/products/nearby
     */
    @GetMapping("/products/nearby")
    public ResponseEntity<?> getNearbyProducts(
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam("radius") Double radius) {
        try {
            List<Product> proximalNodes = productRepository.findNearbyProducts(latitude, longitude, radius);
            return ResponseEntity.ok(proximalNodes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Geofence parsing exception inside backend core: " + e.getMessage());
        }
    }

    /**
     * Maps to: POST http://localhost:8080/api/products
     */
    @PostMapping("/products")
    @Transactional 
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        try {
            // Step 1: Payload validation guard rule
            if (product == null || product.getName() == null || product.getLatitude() == null || product.getLongitude() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Deployment Rejected: Missing required coordinate telemetry metadata parameters.");
            }

            // Step 2: Null-safe session extraction check
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Deployment Rejected: Active session token profile is invalid or expired.");
            }

            String currentUsername = authentication.getName();

            // Step 3: Match identifier string to active database row context
            User currentUser = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new UsernameNotFoundException("Security error: User profile not found for " + currentUsername));

            // Step 4: Map standard bidirectional entity association keys
            product.setUser(currentUser);

            // Step 5: Save record securely to your schema table
            Product savedProduct = productRepository.save(product);

            // Step 6: Return object cleanly. The paired Json reference annotations will handle serialization smoothly.
            return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);

        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace(); 
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Core Database Pipeline Mismatch Rejection: " + e.getMessage());
        }
    }
}