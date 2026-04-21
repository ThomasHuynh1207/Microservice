package com.tuan.authservice.controller;

import com.tuan.authservice.dto.OnboardingConfigDTO;
import com.tuan.authservice.service.OnboardingConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/onboarding-config")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOnboardingConfigController {

    private final OnboardingConfigService onboardingConfigService;

    @GetMapping
    public ResponseEntity<OnboardingConfigDTO> getConfig() {
        return ResponseEntity.ok(onboardingConfigService.getConfig());
    }

    @PutMapping
    public ResponseEntity<OnboardingConfigDTO> updateConfig(@Valid @RequestBody OnboardingConfigDTO request) {
        return ResponseEntity.ok(onboardingConfigService.updateConfig(request));
    }
}
