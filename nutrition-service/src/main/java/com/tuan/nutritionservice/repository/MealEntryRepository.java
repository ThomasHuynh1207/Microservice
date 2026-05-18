package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.MealEntry;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MealEntryRepository extends JpaRepository<MealEntry, Long> {
    List<MealEntry> findByUserIdOrderByEatenAtDesc(Long userId);

    List<MealEntry> findByUserIdAndEatenAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    List<MealEntry> findByEatenAtBetween(LocalDateTime start, LocalDateTime end);

    List<MealEntry> findTop30ByOrderByEatenAtDesc();

    List<MealEntry> findAllByOrderByEatenAtDesc();

    @Query("select count(distinct m.userId) from MealEntry m")
    long countDistinctUsers();
}
