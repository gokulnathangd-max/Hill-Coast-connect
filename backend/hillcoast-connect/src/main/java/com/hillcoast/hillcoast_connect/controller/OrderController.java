package com.hillcoast.hillcoast_connect.controller;

import com.hillcoast.hillcoast_connect.model.Order;
import com.hillcoast.hillcoast_connect.model.Product;
import com.hillcoast.hillcoast_connect.model.User;
import com.hillcoast.hillcoast_connect.repository.OrderRepository;
import com.hillcoast.hillcoast_connect.repository.ProductRepository;
import com.hillcoast.hillcoast_connect.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = {"http://localhost:3000", "http://192.168.56.1:3000"}, allowCredentials = "true")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderController(OrderRepository orderRepository, ProductRepository productRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    /**
     * Maps to: POST http://localhost:8080/api/orders/procure
     */
    @PostMapping("/procure")
    @Transactional
    public ResponseEntity<?> procureAsset(@RequestBody Map<String, Object> payload) {
        try {
            Long productId = Long.valueOf(payload.get("productId").toString());
            Integer requestedQty = Integer.valueOf(payload.get("quantity").toString());

            if (requestedQty <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Procurement Error: Quantity must be greater than zero.");
            }

            // 1. Authenticate context extraction
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Procurement Blocked: Invalid session reference token.");
            }
            String username = auth.getName();
            User buyer = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User verification fault matching username: " + username));

            // 2. Fetch and evaluate targeted resource node inventory capacity status
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new RuntimeException("Target stock node not found in mapping matrix."));

            if (product.getQuantity() < requestedQty) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Supply Deficit: Only " + product.getQuantity() + " units available. Order request rejected.");
            }

            // 3. Atomically adjust underlying quantities down
            product.setQuantity(product.getQuantity() - requestedQty);
            productRepository.save(product);

            // 4. Construct permanent system bill layout trace logs
            Order order = new Order();
            order.setProduct(product);
            order.setBuyer(buyer);
            order.setQuantity(requestedQty);
            order.setTotalAmount(product.getPrice() * requestedQty);
            Order savedOrder = orderRepository.save(order);

            // 5. Structure confirmation response object maps safely to skip heavy lazily loaded properties
            Map<String, Object> orderDetails = new HashMap<>();
            orderDetails.put("orderId", savedOrder.getId());
            orderDetails.put("item", product.getName());
            orderDetails.put("purchasedQty", savedOrder.getQuantity());
            orderDetails.put("totalCost", savedOrder.getTotalAmount());
            orderDetails.put("remainingStock", product.getQuantity());

            return ResponseEntity.status(HttpStatus.CREATED).body(orderDetails);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Procurement pipeline critical error: " + e.getMessage());
        }
    }
}