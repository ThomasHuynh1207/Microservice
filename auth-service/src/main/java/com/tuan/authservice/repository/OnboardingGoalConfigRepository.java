package com.tuan.authservice.repository;

import com.tuan.authservice.entity.OnboardingGoalConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingGoalConfigRepository extends JpaRepository<OnboardingGoalConfig, Long> {

    Optional<OnboardingGoalConfig> findByGoalTypeIgnoreCase(String goalType);
}
