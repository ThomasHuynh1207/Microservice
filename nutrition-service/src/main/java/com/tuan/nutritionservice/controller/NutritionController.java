package com.tuan.nutritionservice.controller;

import com.tuan.nutritionservice.entity.MealEntry;
import com.tuan.nutritionservice.entity.NutritionPlan;
import com.tuan.nutritionservice.service.NutritionService;
import com.tuan.nutritionservice.service.NutritionService.FoodSuggestion;
import com.tuan.nutritionservice.service.NutritionService.MealEntryRequest;
import com.tuan.nutritionservice.service.NutritionService.NutritionPlanRequest;
import com.tuan.nutritionservice.service.NutritionService.NutritionSummary;
import com.tuan.nutritionservice.service.NutritionService.WaterRequest;
import com.tuan.nutritionservice.service.NutritionService.WaterSummary;
import com.tuan.nutritionservice.entity.WaterEntry;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nutrition")
public class NutritionController {
    private final NutritionService nutritionService;

    public NutritionController(NutritionService nutritionService) {
        this.nutritionService = nutritionService;
    }

    @GetMapping("/{userId}/plan")
    NutritionPlan plan(@PathVariable Long userId) {
        return nutritionService.getOrCreatePlan(userId);
    }

    @PutMapping("/{userId}/plan")
    NutritionPlan updatePlan(@PathVariable Long userId, @RequestBody NutritionPlanRequest request) {
        return nutritionService.updatePlan(userId, request);
    }

    @GetMapping("/{userId}/meals")
    List<MealEntry> meals(@PathVariable Long userId) {
        return nutritionService.meals(userId);
    }

    @PostMapping("/meals")
    MealEntry addMeal(@RequestBody MealEntryRequest request) {
        return nutritionService.addMeal(request);
    }

    @GetMapping("/{userId}/summary")
    NutritionSummary summary(@PathVariable Long userId) {
        return nutritionService.summary(userId);
    }

    @GetMapping("/library")
    List<FoodSuggestion> library() {
        return nutritionService.library();
    }

    @PostMapping("/{userId}/water")
    WaterEntry logWater(@PathVariable Long userId, @RequestBody WaterRequest request) {
        return nutritionService.logWater(userId, request);
    }

    @GetMapping("/{userId}/water/today")
    WaterSummary waterToday(@PathVariable Long userId) {
        return nutritionService.waterToday(userId);
    }
}
