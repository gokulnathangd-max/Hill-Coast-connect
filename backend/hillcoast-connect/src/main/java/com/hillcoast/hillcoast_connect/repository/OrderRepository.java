package com.hillcoast.hillcoast_connect.repository;

import com.hillcoast.hillcoast_connect.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface OrderRepository extends JpaRepository<Order, Long> {
    // Allows buyers to track their own procurement order histories
    List<Order> findByBuyerId(Long buyerId);
}