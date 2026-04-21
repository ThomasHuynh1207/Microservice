package com.tuan.nutritionservice.controller;

import com.tuan.nutritionservice.dto.request.UpsertNutritionProfileRequest;
import com.tuan.nutritionservice.dto.response.UserNutritionProfileDto;
import com.tuan.nutritionservice.service.NutritionProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/nutrition-profiles")
@RequiredArgsConstructor
public class NutritionProfileController {

    private final NutritionProfileService nutritionProfileService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserNutritionProfileDto> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(nutritionProfileService.getByUserId(userId));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserNutritionProfileDto> upsertProfile(
            @PathVariable Long userId,
            @Valid @RequestBody UpsertNutritionProfileRequest request) {
        return ResponseEntity.ok(nutritionProfileService.upsert(userId, request));
    }
}