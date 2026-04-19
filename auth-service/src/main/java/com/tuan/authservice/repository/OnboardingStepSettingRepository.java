package com.tuan.authservice.repository;

import com.tuan.authservice.entity.OnboardingStepSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OnboardingStepSettingRepository extends JpaRepository<OnboardingStepSetting, Long> {

    Optional<OnboardingStepSetting> findByStepIndex(Integer stepIndex);

    List<OnboardingStepSetting> findAllByOrderByStepIndexAsc();
}
