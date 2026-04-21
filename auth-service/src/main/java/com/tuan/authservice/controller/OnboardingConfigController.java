package com.tuan.authservice.controller;

import com.tuan.authservice.dto.OnboardingConfigDTO;
import com.tuan.authservice.service.OnboardingConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/onboarding-config")
@RequiredArgsConstructor
public class OnboardingConfigController {

    private final OnboardingConfigService onboardingConfigService;

    @GetMapping
    public ResponseEntity<OnboardingConfigDTO> getConfig() {
        return ResponseEntity.ok(onboardingConfigService.getConfig());
    }
}
