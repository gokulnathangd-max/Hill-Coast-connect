package com.hillcoast.hillcoast_connect.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    private Integer quantity;

    private Double latitude;
    private Double longitude;

    // CRITICAL FIX: Establish the relational link back to the User model schema
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producer_id", nullable = false) // Maps directly to your MySQL constraint
    private User producer;

    public Product() {}

    // Getters and Setters for the new producer relational mapping
    public User getProducer() { return producer; }
    public void setProducer(User producer) { this.producer = producer; }

    // Keep all your other existing getters and setters exactly as they are...
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}