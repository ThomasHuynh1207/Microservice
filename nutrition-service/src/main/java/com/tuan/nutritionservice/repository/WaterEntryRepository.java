package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.WaterEntry;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WaterEntryRepository extends JpaRepository<WaterEntry, Long> {
    List<WaterEntry> findByUserIdAndLoggedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
}
