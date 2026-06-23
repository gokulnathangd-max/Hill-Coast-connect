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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public ResponseEntity<?> getAllProducts() {
        try {
            List<Product> products = productRepository.findAll();
            
            List<Map<String, Object>> flatList = products.stream().map(p -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", p.getId());
                map.put("name", p.getName());
                map.put("price", p.getPrice());
                map.put("quantity", p.getQuantity());
                map.put("latitude", p.getLatitude());
                map.put("longitude", p.getLongitude());
                if (p.getUser() != null) {
                    map.put("producerName", p.getUser().getUsername());
                }
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(flatList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to parse network streams: " + e.getMessage());
        }
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
            
            List<Map<String, Object>> flatList = proximalNodes.stream().map(p -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", p.getId());
                map.put("name", p.getName());
                map.put("price", p.getPrice());
                map.put("quantity", p.getQuantity());
                map.put("latitude", p.getLatitude());
                map.put("longitude", p.getLongitude());
                if (p.getUser() != null) {
                    map.put("producerName", p.getUser().getUsername());
                }

                // --- LIVE MATHEMATICAL DISTANCE INJECTION ---
                double lat1 = Math.toRadians(latitude);
                double lon1 = Math.toRadians(longitude);
                double lat2 = Math.toRadians(p.getLatitude());
                double lon2 = Math.toRadians(p.getLongitude());

                double dlon = lon2 - lon1;
                double dlat = lat2 - lat1;
                double a = Math.pow(Math.sin(dlat / 2), 2)
                         + Math.cos(lat1) * Math.cos(lat2)
                         * Math.pow(Math.sin(dlon / 2), 2);
                double c = 2 * Math.asin(Math.sqrt(a));
                double calculatedDistance = 6371 * c;

                map.put("distanceText", String.format("%.1f KM away", calculatedDistance));
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(flatList);
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
            if (product == null || product.getName() == null || product.getLatitude() == null || product.getLongitude() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Deployment Rejected: Missing required telemetry metadata parameters.");
            }

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Deployment Rejected: Active session token profile is invalid or expired.");
            }

            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new UsernameNotFoundException("Security error: User profile not found for " + currentUsername));

            product.setUser(currentUser);
            Product savedProduct = productRepository.save(product);
            return new ResponseEntity<>(savedProduct, HttpStatus.CREATED);

        } catch (UsernameNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Core Database Pipeline Mismatch Rejection: " + e.getMessage());
        }
    }

    /**
     * Maps to: DELETE http://localhost:8080/api/products/{id}
     */
    @DeleteMapping("/products/{id}")
    @Transactional
    public ResponseEntity<?> deleteProduct(@PathVariable("id") Long id) {
        try {
            if (!productRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Target asset node does not exist.");
            }
            productRepository.deleteById(id);
            return ResponseEntity.ok("Asset node successfully decommissioned from perimeter grid.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Deletion rejection: " + e.getMessage());
        }
    }
}