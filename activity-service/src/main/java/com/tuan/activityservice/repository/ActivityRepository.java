package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.SportType;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByUserIdOrderByStartedAtDesc(Long userId);

    List<Activity> findByUserIdAndStartedAtAfter(Long userId, LocalDateTime startedAt);

    List<Activity> findAllByOrderByStartedAtDesc();

    long countBySportType(SportType sportType);
}
