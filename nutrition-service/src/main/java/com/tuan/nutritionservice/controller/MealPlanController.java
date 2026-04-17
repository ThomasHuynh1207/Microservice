package com.tuan.nutritionservice.controller;

import com.tuan.nutritionservice.dto.request.AddCustomMealItemRequest;
import com.tuan.nutritionservice.dto.request.GenerateMealPlanRequest;
import com.tuan.nutritionservice.dto.request.TrackMealRequest;
import com.tuan.nutritionservice.dto.request.UpdateMealItemRequest;
import com.tuan.nutritionservice.dto.response.MealPlanProgressResponse;
import com.tuan.nutritionservice.dto.response.MealPlanResponse;
import com.tuan.nutritionservice.service.MealPlanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meal-plans")
@RequiredArgsConstructor
public class MealPlanController {

    private final MealPlanService mealPlanService;

    @PostMapping("/generate")
    public ResponseEntity<MealPlanResponse> generateMealPlan(@Valid @RequestBody GenerateMealPlanRequest request) {
        MealPlanResponse response = mealPlanService.generateMealPlan(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{planId}")
    public ResponseEntity<MealPlanResponse> getMealPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(mealPlanService.getMealPlan(planId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MealPlanResponse>> getMealPlansByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(mealPlanService.getMealPlansByUser(userId));
    }

    @PutMapping("/{planId}/items/{itemId}")
    public ResponseEntity<MealPlanResponse> updateMealItem(
            @PathVariable Long planId,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateMealItemRequest request) {
        return ResponseEntity.ok(mealPlanService.updateMealItem(planId, itemId, request));
    }

    @PostMapping("/{planId}/items")
    public ResponseEntity<MealPlanResponse> addCustomMealItem(
            @PathVariable Long planId,
            @Valid @RequestBody AddCustomMealItemRequest request) {
        return ResponseEntity.ok(mealPlanService.addCustomMealItem(planId, request));
    }

    @PostMapping("/{planId}/save")
    public ResponseEntity<MealPlanResponse> saveMealPlan(@PathVariable Long planId) {
        return ResponseEntity.ok(mealPlanService.saveMealPlan(planId));
    }

    @PatchMapping("/{planId}/days/{dayIndex}/meals/{itemId}/track")
    public ResponseEntity<MealPlanProgressResponse> trackMeal(
            @PathVariable Long planId,
            @PathVariable Integer dayIndex,
            @PathVariable Long itemId,
            @Valid @RequestBody TrackMealRequest request) {
        return ResponseEntity.ok(mealPlanService.trackMeal(planId, dayIndex, itemId, request));
    }

    @GetMapping("/{planId}/progress")
    public ResponseEntity<MealPlanProgressResponse> getProgress(@PathVariable Long planId) {
        return ResponseEntity.ok(mealPlanService.getMealPlanProgress(planId));
    }
}
