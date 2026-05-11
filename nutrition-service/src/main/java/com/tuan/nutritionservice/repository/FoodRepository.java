package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.Food;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findAllByActiveTrueOrderByNameAsc();

    List<Food> findAllByOrderByNameAsc();

    boolean existsByNameIgnoreCase(String name);

    long countByActiveTrue();
}
