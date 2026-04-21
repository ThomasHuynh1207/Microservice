package com.tuan.authservice.config;

import com.tuan.authservice.service.OnboardingConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DefaultOnboardingConfigInitializer implements CommandLineRunner {

    private final OnboardingConfigService onboardingConfigService;

    @Override
    public void run(String... args) {
        onboardingConfigService.ensureDefaults();
    }
}
