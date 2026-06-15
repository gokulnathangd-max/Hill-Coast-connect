package com.hillcoast.hillcoast_connect.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private Double price;
    private Integer quantity;
    private Double latitude;
    private Double longitude;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonBackReference // Child reference point: Stops Jackson from crawling back up into User infinitely
    private User user;

    public Product() {}

    public Product(String name, Double price, Integer quantity, Double latitude, Double longitude, User user) {
        this.name = name;
        this.price = price;
        this.quantity = quantity;
        this.latitude = latitude;
        this.longitude = longitude;
        this.user = user;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}