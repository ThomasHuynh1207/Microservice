package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.dto.request.TrackMealRequest;
import com.tuan.nutritionservice.dto.response.MealPlanProgressResponse;
import com.tuan.nutritionservice.entity.DailyMeal;
import com.tuan.nutritionservice.entity.MealItem;
import com.tuan.nutritionservice.entity.MealPlan;
import com.tuan.nutritionservice.exception.NutritionException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MealPlanTrackingService {

    public MealPlanProgressResponse trackMeal(MealPlan plan, Integer dayIndex, Long itemId, TrackMealRequest request) {
        DailyMeal dailyMeal = plan.getDailyMeals().stream()
                .filter(day -> day.getDayIndex().equals(dayIndex))
                .findFirst()
                .orElseThrow(() -> new NutritionException("Ngày không tồn tại trong plan"));

        MealItem mealItem = dailyMeal.getItems().stream()
                .filter(item -> item.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new NutritionException("Meal item không tồn tại"));

        mealItem.setEaten(request.getEaten());
        mealItem.setActualCalories(request.getActualCalories());
        mealItem.setActualProtein(request.getActualProtein());
        mealItem.setActualCarbs(request.getActualCarbs());
        mealItem.setActualFat(request.getActualFat());

        return calculateProgress(plan);
    }

    public MealPlanProgressResponse calculateProgress(MealPlan plan) {
        List<MealItem> allItems = plan.getDailyMeals().stream()
                .flatMap(day -> day.getItems().stream())
                .toList();

        long eatenMeals = allItems.stream().filter(MealItem::getEaten).count();
        int totalMeals = allItems.size();

        double actualCalories = allItems.stream().mapToDouble(item -> item.getActualCalories() != null ? item.getActualCalories() : 0).sum();
        double actualProtein = allItems.stream().mapToDouble(item -> item.getActualProtein() != null ? item.getActualProtein() : 0).sum();
        double actualCarbs = allItems.stream().mapToDouble(item -> item.getActualCarbs() != null ? item.getActualCarbs() : 0).sum();
        double actualFat = allItems.stream().mapToDouble(item -> item.getActualFat() != null ? item.getActualFat() : 0).sum();

        double caloriesTarget = plan.getTargetCalories() != null ? plan.getTargetCalories() * 7.0 : 1.0;
        double proteinTarget = plan.getProteinTarget() != null ? plan.getProteinTarget() * 7.0 : 1.0;
        double carbsTarget = plan.getCarbsTarget() != null ? plan.getCarbsTarget() * 7.0 : 1.0;
        double fatTarget = plan.getFatTarget() != null ? plan.getFatTarget() * 7.0 : 1.0;

        return MealPlanProgressResponse.builder()
                .planId(plan.getId())
                .eatenMeals((int) eatenMeals)
                .totalMeals(totalMeals)
                .caloriesCompletion(normalizeCompletion(actualCalories, caloriesTarget))
                .proteinCompletion(normalizeCompletion(actualProtein, proteinTarget))
                .carbsCompletion(normalizeCompletion(actualCarbs, carbsTarget))
                .fatCompletion(normalizeCompletion(actualFat, fatTarget))
                .build();
    }

    private double normalizeCompletion(double actual, double target) {
        if (target <= 0) {
            return 0.0;
        }
        return Math.min(100.0, (actual / target) * 100.0);
    }
}
