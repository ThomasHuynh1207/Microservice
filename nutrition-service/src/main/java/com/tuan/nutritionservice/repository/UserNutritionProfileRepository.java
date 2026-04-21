package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.UserNutritionProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserNutritionProfileRepository extends JpaRepository<UserNutritionProfile, Long> {

    Optional<UserNutritionProfile> findByUserId(Long userId);
}