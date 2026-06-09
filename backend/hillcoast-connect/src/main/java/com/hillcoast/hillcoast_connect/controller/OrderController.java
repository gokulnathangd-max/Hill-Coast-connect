package com.hillcoast.hillcoast_connect.controller;

import com.hillcoast.hillcoast_connect.model.Order;
import com.hillcoast.hillcoast_connect.repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderRepository orderRepository;

    public OrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @PostMapping
    public ResponseEntity<Order> placeOrder(@RequestBody Order order) {
        if (order.getItems() != null) {
            order.getItems().forEach(item -> item.setOrder(order));
        }
        return ResponseEntity.ok(orderRepository.save(order));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<Order>> getBuyerOrders(@PathVariable Long buyerId) {
        return ResponseEntity.ok(orderRepository.findByBuyerId(buyerId));
    }
}