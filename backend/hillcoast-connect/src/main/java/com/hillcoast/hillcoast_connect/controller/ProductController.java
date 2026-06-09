package com.hillcoast.hillcoast_connect.controller;

import com.hillcoast.hillcoast_connect.model.Product;
import com.hillcoast.hillcoast_connect.repository.ProductRepository;
import com.hillcoast.hillcoast_connect.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.hillcoast.hillcoast_connect.model.User;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = {"http://localhost:3000", "http://192.168.56.1:3000"})
public class ProductController {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ProductController(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    // NEW LOCATION-BASED GEOFENCE ENDPOINT
    @GetMapping("/nearby")
    public ResponseEntity<List<Product>> getNearbyProducts(
            @RequestParam("latitude") Double latitude,
            @RequestParam("longitude") Double longitude,
            @RequestParam(value = "radius", defaultValue = "10.0") Double radius) {
        try {
            System.out.println("Scanning geofence at Lat: " + latitude + ", Lng: " + longitude + " within " + radius + "km");
            List<Product> nearbyNodes = productRepository.findNearbyProducts(latitude, longitude, radius);
            return ResponseEntity.ok(nearbyNodes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
public ResponseEntity<?> createProduct(@RequestBody Product product) {
    try {
        // 1. Extract the verified username from your stateless security context token memory
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        
        // 2. Fetch the complete User entity matching that name record from the MySQL database
        User currentProducer = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Authenticated node operator profile not found."));
        
        // CRITICAL SECURITY CHECK: Enforce that only PRODUCERS can create assets
        if (!"PRODUCER".equalsIgnoreCase(currentProducer.getRole())) {
            return ResponseEntity.status(403).body("Security Rejection: Only verified PRODUCER profiles are authorized to deploy telemetry nodes.");
        }
        
        // 3. Inject the user reference into the product object before committing the transaction
        product.setProducer(currentProducer);
        
        System.out.println("Assigning telemetry node to producer: " + currentUsername);
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.ok(savedProduct);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Database write mismatch error: " + e.getMessage());
    }
}

    // Your existing @PostMapping method remains completely untouched below...
}