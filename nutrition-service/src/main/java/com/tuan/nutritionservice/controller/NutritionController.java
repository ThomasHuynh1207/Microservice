package com.tuan.nutritionservice.controller;

import com.tuan.nutritionservice.entity.Food;
import com.tuan.nutritionservice.entity.MealEntry;
import com.tuan.nutritionservice.entity.NutritionPlan;
import com.tuan.nutritionservice.entity.WaterEntry;
import com.tuan.nutritionservice.service.NutritionService;
import com.tuan.nutritionservice.service.NutritionService.FoodMealRequest;
import com.tuan.nutritionservice.service.NutritionService.FoodRequest;
import com.tuan.nutritionservice.service.NutritionService.FoodSuggestion;
import com.tuan.nutritionservice.service.NutritionService.MealEntryRequest;
import com.tuan.nutritionservice.service.NutritionService.NutritionAdminOverview;
import com.tuan.nutritionservice.service.NutritionService.NutritionPlanRequest;
import com.tuan.nutritionservice.service.NutritionService.NutritionSummary;
import com.tuan.nutritionservice.service.NutritionService.QuickMealRequest;
import com.tuan.nutritionservice.service.NutritionService.RecoveryRequest;
import com.tuan.nutritionservice.service.NutritionService.RecoverySuggestion;
import com.tuan.nutritionservice.service.NutritionService.WaterRequest;
import com.tuan.nutritionservice.service.NutritionService.WaterSummary;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/nutrition")
public class NutritionController {
    private final NutritionService nutritionService;

    public NutritionController(NutritionService nutritionService) {
        this.nutritionService = nutritionService;
    }

    @GetMapping("/foods")
    List<Food> foods(@RequestParam(defaultValue = "") String q) {
        return nutritionService.foods(q);
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

    @PostMapping("/{userId}/meals/from-food")
    MealEntry addMealFromFood(@PathVariable Long userId, @RequestBody FoodMealRequest request) {
        return nutritionService.addMealFromFood(userId, request);
    }

    @PostMapping("/{userId}/meals/quick")
    MealEntry quickAddMeal(@PathVariable Long userId, @RequestBody QuickMealRequest request) {
        return nutritionService.quickAddMeal(userId, request);
    }

    @GetMapping("/{userId}/summary")
    NutritionSummary summary(@PathVariable Long userId) {
        return nutritionService.summary(userId);
    }

    @PostMapping("/recovery-suggestion")
    RecoverySuggestion recoverySuggestion(@RequestBody RecoveryRequest request) {
        return nutritionService.recoverySuggestion(request);
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

    @GetMapping("/admin/overview")
    ResponseEntity<NutritionAdminOverview> adminOverview(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(nutritionService.adminOverview());
    }

    @GetMapping("/admin/foods")
    ResponseEntity<List<Food>> adminFoods(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(nutritionService.adminFoods());
    }

    @PostMapping("/admin/foods")
    ResponseEntity<Food> createFood(
            @RequestBody FoodRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(nutritionService.createFood(request));
    }

    @PutMapping("/admin/foods/{foodId}")
    ResponseEntity<Food> updateFood(
            @PathVariable Long foodId,
            @RequestBody FoodRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(nutritionService.updateFood(foodId, request));
    }

    @DeleteMapping("/admin/foods/{foodId}")
    ResponseEntity<Void> deactivateFood(
            @PathVariable Long foodId,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        nutritionService.deactivateFood(foodId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/meals/recent")
    ResponseEntity<List<MealEntry>> recentMeals(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(nutritionService.recentMeals());
    }

    private boolean isAdmin(String requesterRole) {
        return requesterRole != null && requesterRole.equalsIgnoreCase("ADMIN");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }
}
