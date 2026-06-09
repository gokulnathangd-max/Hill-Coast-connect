package com.hillcoast.hillcoast_connect.repository;

import com.hillcoast.hillcoast_connect.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductId(Long productId);
}