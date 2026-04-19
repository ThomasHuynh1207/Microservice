package com.tuan.authservice.controller;

import com.tuan.authservice.dto.OnboardingStepSettingDTO;
import com.tuan.authservice.dto.UpdateOnboardingStepSettingRequest;
import com.tuan.authservice.service.OnboardingStepSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/onboarding-steps")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOnboardingStepController {

    private final OnboardingStepSettingService onboardingStepSettingService;

    @GetMapping
    public ResponseEntity<List<OnboardingStepSettingDTO>> listSettings() {
        return ResponseEntity.ok(onboardingStepSettingService.getAllSettings());
    }

    @PutMapping("/{stepIndex}")
    public ResponseEntity<OnboardingStepSettingDTO> updateSetting(
            @PathVariable Integer stepIndex,
            @Valid @RequestBody UpdateOnboardingStepSettingRequest request
    ) {
        return ResponseEntity.ok(onboardingStepSettingService.updateSetting(stepIndex, request));
    }
}
