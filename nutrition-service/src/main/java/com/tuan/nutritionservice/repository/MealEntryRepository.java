package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.MealEntry;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealEntryRepository extends JpaRepository<MealEntry, Long> {
    List<MealEntry> findByUserIdOrderByEatenAtDesc(Long userId);

    List<MealEntry> findByUserIdAndEatenAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
}
