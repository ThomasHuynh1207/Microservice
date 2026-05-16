package com.tuan.athleteservice.repository;

import com.tuan.athleteservice.entity.OnboardingGoal;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingGoalRepository extends JpaRepository<OnboardingGoal, Long> {
    List<OnboardingGoal> findAllByOrderBySortOrderAscCreatedAtAsc();
    boolean existsByTitle(String title);
}
