package com.tuan.workoutservice.repository;

import com.tuan.workoutservice.entity.WorkoutSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {
    List<WorkoutSession> findByUserId(Long userId);
    List<WorkoutSession> findByWorkoutPlanId(Long workoutPlanId);
}