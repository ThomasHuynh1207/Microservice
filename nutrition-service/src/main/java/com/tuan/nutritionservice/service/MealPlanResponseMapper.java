package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.dto.response.DailyMealResponse;
import com.tuan.nutritionservice.dto.response.MealItemResponse;
import com.tuan.nutritionservice.dto.response.MealPlanResponse;
import com.tuan.nutritionservice.entity.DailyMeal;
import com.tuan.nutritionservice.entity.MealItem;
import com.tuan.nutritionservice.entity.MealPlan;

import java.util.List;
import java.util.stream.Collectors;

public class MealPlanResponseMapper {

    public static MealPlanResponse toResponse(MealPlan plan) {
        return MealPlanResponse.builder()
                .id(plan.getId())
                .userId(plan.getUserId())
                .name(plan.getName())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .mealsPerDay(plan.getMealsPerDay())
                .targetCalories(plan.getTargetCalories())
                .proteinTarget(plan.getProteinTarget())
                .carbsTarget(plan.getCarbsTarget())
                .fatTarget(plan.getFatTarget())
                .status(plan.getStatus() != null ? plan.getStatus().name() : null)
                .dailyMeals(toDailyMealResponses(plan.getDailyMeals()))
                .build();
    }

    private static List<DailyMealResponse> toDailyMealResponses(List<DailyMeal> dailyMeals) {
        return dailyMeals.stream()
                .map(daily -> DailyMealResponse.builder()
                        .dayIndex(daily.getDayIndex())
                        .dayDate(daily.getDayDate())
                        .items(toMealItemResponses(daily.getItems()))
                        .build())
                .collect(Collectors.toList());
    }

    private static List<MealItemResponse> toMealItemResponses(List<MealItem> items) {
        return items.stream()
                .map(item -> MealItemResponse.builder()
                        .id(item.getId())
                        .name(item.getCustomName() != null ? item.getCustomName() : getFoodItemName(item))
                        .mealType(item.getMealType() != null ? item.getMealType().name() : null)
                        .calories(item.getCalories())
                        .protein(item.getProtein())
                        .carbs(item.getCarbs())
                        .fat(item.getFat())
                        .quantity(item.getQuantity())
                        .eaten(item.getEaten())
                        .actualCalories(item.getActualCalories())
                        .actualProtein(item.getActualProtein())
                        .actualCarbs(item.getActualCarbs())
                        .actualFat(item.getActualFat())
                        .build())
                .collect(Collectors.toList());
    }

    private static String getFoodItemName(MealItem item) {
        return item.getFoodItem() != null ? item.getFoodItem().getName() : "Unknown item";
    }
}
