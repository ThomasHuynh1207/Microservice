package com.tuan.authservice.repository;

import com.tuan.authservice.entity.OnboardingActivityConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingActivityConfigRepository extends JpaRepository<OnboardingActivityConfig, Long> {

    Optional<OnboardingActivityConfig> findByActivityLevelIgnoreCase(String activityLevel);
}
