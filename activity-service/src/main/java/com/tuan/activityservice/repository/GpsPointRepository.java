package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.GpsPoint;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GpsPointRepository extends JpaRepository<GpsPoint, Long> {
    List<GpsPoint> findByActivityIdOrderBySequenceOrderAsc(Long activityId);
    void deleteByActivityId(Long activityId);
}
