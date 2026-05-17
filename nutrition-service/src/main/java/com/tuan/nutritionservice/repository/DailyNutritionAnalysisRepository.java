package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.DailyNutritionAnalysis;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyNutritionAnalysisRepository extends JpaRepository<DailyNutritionAnalysis, Long> {

    Optional<DailyNutritionAnalysis> findByUserIdAndDate(Long userId, LocalDate date);

    List<DailyNutritionAnalysis> findByUserIdAndDateBetweenOrderByDateDesc(
            Long userId, LocalDate from, LocalDate to);
}
