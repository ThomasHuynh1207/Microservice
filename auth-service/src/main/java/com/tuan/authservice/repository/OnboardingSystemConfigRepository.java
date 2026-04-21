package com.tuan.authservice.repository;

import com.tuan.authservice.entity.OnboardingSystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OnboardingSystemConfigRepository extends JpaRepository<OnboardingSystemConfig, Long> {

    Optional<OnboardingSystemConfig> findTopByOrderByIdAsc();
}
