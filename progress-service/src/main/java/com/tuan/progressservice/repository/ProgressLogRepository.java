package com.tuan.progressservice.repository;

import com.tuan.progressservice.entity.ProgressLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProgressLogRepository extends JpaRepository<ProgressLog, Long> {
    List<ProgressLog> findByUserId(Long userId);
    List<ProgressLog> findByUserIdAndDateBetween(Long userId, LocalDate startDate, LocalDate endDate);
}