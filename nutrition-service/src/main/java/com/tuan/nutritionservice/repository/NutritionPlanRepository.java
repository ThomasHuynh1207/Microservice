package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.NutritionPlan;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NutritionPlanRepository extends JpaRepository<NutritionPlan, Long> {
    Optional<NutritionPlan> findByUserId(Long userId);
}
