package com.tuan.authservice.config;

import com.tuan.authservice.service.OnboardingStepSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DefaultOnboardingSettingsInitializer implements CommandLineRunner {

    private final OnboardingStepSettingService onboardingStepSettingService;

    @Override
    public void run(String... args) {
        onboardingStepSettingService.ensureDefaults();
    }
}
