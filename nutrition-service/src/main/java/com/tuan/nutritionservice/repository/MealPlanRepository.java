package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {
    List<MealPlan> findByUserIdOrderByStartDateDesc(Long userId);
}
