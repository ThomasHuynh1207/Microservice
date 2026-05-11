package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.SavedRoute;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SavedRouteRepository extends JpaRepository<SavedRoute, Long> {
    List<SavedRoute> findByUserId(Long userId);

    boolean existsByUserIdAndRoute_Id(Long userId, Long routeId);

    void deleteByUserIdAndRoute_Id(Long userId, Long routeId);

    void deleteByRoute_Id(Long routeId);
}
