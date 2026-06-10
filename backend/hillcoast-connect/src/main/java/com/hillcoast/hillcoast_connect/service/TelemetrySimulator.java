package com.hillcoast.hillcoast_connect.service;

import com.hillcoast.hillcoast_connect.model.Product;
import com.hillcoast.hillcoast_connect.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class TelemetrySimulator {

    @Autowired
    private ProductRepository productRepository;

    private final Random random = new Random();

    // Runs every 5000 milliseconds (5 seconds) after the last execution completes
    @Scheduled(fixedDelay = 5000)
    public void simulateNodeMovement() {
        List<Product> products = productRepository.findAll();
        
        if (products.isEmpty()) {
            return;
        }

        for (Product product : products) {
            if (product.getLatitude() != null && product.getLongitude() != null) {
                // Generate a tiny random micro-step deviation (-0.0002 to +0.0002 decimal degrees)
                double latOffset = (random.nextDouble() * 0.0004) - 0.0002;
                double lngOffset = (random.nextDouble() * 0.0004) - 0.0002;

                product.setLatitude(product.getLatitude() + latOffset);
                product.setLongitude(product.getLongitude() + lngOffset);
                
                productRepository.save(product);
            }
        }
        System.out.println("📡 Telemetry Simulation Engine: Updated coordinate vectors for " + products.size() + " transit nodes.");
    }
}