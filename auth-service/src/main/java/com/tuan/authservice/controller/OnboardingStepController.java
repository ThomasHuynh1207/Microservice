package com.tuan.authservice.controller;

import com.tuan.authservice.dto.OnboardingStepSettingDTO;
import com.tuan.authservice.service.OnboardingStepSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auth/onboarding-steps")
@RequiredArgsConstructor
public class OnboardingStepController {

    private final OnboardingStepSettingService onboardingStepSettingService;

    @GetMapping
    public ResponseEntity<List<OnboardingStepSettingDTO>> listSettings() {
        return ResponseEntity.ok(onboardingStepSettingService.getAllSettings());
    }
}
