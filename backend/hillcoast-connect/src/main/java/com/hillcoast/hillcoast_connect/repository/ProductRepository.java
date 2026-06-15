package com.hillcoast.hillcoast_connect.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.hillcoast.hillcoast_connect.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * UNIVERSAL GEOFENCE QUERY: Native Haversine evaluation for map radius sweeps.
     * Computes real-time physical distance between node coordinate arrays via MySQL.
     */
    @Query(value = "SELECT * FROM products p WHERE (6371 * acos(cos(radians(:lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(p.latitude)))) <= :radius", nativeQuery = true)
    List<Product> findNearbyProducts(@Param("lat") Double lat, 
                                     @Param("lng") Double lng, 
                                     @Param("radius") Double radius);

    /**
     * Relationship navigation helper to trace ownership boundaries cleanly 
     * without generating lazy initialization property reference exceptions.
     */
    List<Product> findByUserUsername(String username);
}