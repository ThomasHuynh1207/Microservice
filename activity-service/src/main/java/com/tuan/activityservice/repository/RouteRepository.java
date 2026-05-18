package com.tuan.activityservice.repository;

import com.tuan.activityservice.entity.Route;
import com.tuan.activityservice.entity.SportType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface RouteRepository extends JpaRepository<Route, Long>, JpaSpecificationExecutor<Route> {
    /** Returns all PUBLIC routes plus legacy routes that have visibility = NULL (backward compat). */
    @Query("SELECT r FROM Route r WHERE r.visibility = 'PUBLIC' OR r.visibility IS NULL")
    List<Route> findPublicRoutes();

    List<Route> findByVisibility(String visibility);
    List<Route> findByCreatedByAndVisibility(Long createdBy, String visibility);

    long countBySportType(SportType sportType);
}
