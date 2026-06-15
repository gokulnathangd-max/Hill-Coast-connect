package com.hillcoast.hillcoast_connect.controller;

import com.hillcoast.hillcoast_connect.model.Product;
import com.hillcoast.hillcoast_connect.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {"http://localhost:3000", "http://192.168.56.1:3000"})
public class AnalyticsController {

    private final ProductRepository productRepository;

    public AnalyticsController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping("/producer/regional")
    public ResponseEntity<?> getProducerRegionalAnalytics(Authentication authentication) {
        // Safe context evaluation: Extracts the network username string straight from your active JWT security filter
        String currentProducerName = authentication.getName(); 
        
        // FIXED: Updated method call to use findByUserUsername to align with our property refactor
        List<Product> producerNodes = productRepository.findByUserUsername(currentProducerName);

        // Stream and calculate the total financial value stake of this producer's assets
        double totalValue = producerNodes.stream()
                .mapToDouble(p -> p.getPrice() * (p.getQuantity() != null ? p.getQuantity() : 0))
                .sum();

        // Build the structured JSON return metrics payload
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("ownedNodesCount", producerNodes.size());
        metrics.put("totalInventoryValue", totalValue);
        metrics.put("ownedNodes", producerNodes);

        return ResponseEntity.ok(metrics);
    }
}