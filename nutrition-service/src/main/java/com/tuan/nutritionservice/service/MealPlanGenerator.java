package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.dto.request.GenerateMealPlanRequest;
import com.tuan.nutritionservice.dto.response.UserNutritionProfileDto;
import com.tuan.nutritionservice.entity.DailyMeal;
import com.tuan.nutritionservice.entity.FoodItem;
import com.tuan.nutritionservice.entity.MealItem;
import com.tuan.nutritionservice.entity.MealPlan;
import com.tuan.nutritionservice.entity.MealPlanStatus;
import com.tuan.nutritionservice.entity.MealType;
import com.tuan.nutritionservice.exception.NutritionException;
import com.tuan.nutritionservice.repository.FoodItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class MealPlanGenerator {

    private final FoodItemRepository foodItemRepository;

    public MealPlan generate(GenerateMealPlanRequest request, UserNutritionProfileDto profile) {
        Set<String> allergies = Optional.ofNullable(request.getAllergies()).orElse(profile.getAllergies());
        if (allergies == null) {
            allergies = Set.of();
        }
        Set<String> preferences = Optional.ofNullable(request.getPreferences()).orElse(profile.getPreferences());
        if (preferences == null) {
            preferences = Set.of();
        }
        int mealsPerDay = Optional.ofNullable(request.getMealsPerDay())
                .orElse(Optional.ofNullable(profile.getMealsPerDay()).orElse(3));

        MealPlan mealPlan = MealPlan.builder()
                .userId(request.getUserId())
                .name("7-day personalized meal plan")
                .startDate(request.getStartDate())
                .endDate(request.getStartDate().plusDays(6))
                .mealsPerDay(mealsPerDay)
                .targetCalories(request.getTargetCalories())
                .proteinTarget(request.getProteinTarget())
                .carbsTarget(request.getCarbsTarget())
                .fatTarget(request.getFatTarget())
                .status(MealPlanStatus.DRAFT)
                .build();

        for (int dayIndex = 1; dayIndex <= 7; dayIndex++) {
            LocalDate date = request.getStartDate().plusDays(dayIndex - 1);
            DailyMeal dailyMeal = createDailyMeal(mealPlan, dayIndex, date, mealsPerDay,
                    request.getTargetCalories(), request.getProteinTarget(), request.getCarbsTarget(), request.getFatTarget(), preferences, allergies);
            mealPlan.getDailyMeals().add(dailyMeal);
        }

        return mealPlan;
    }

    private DailyMeal createDailyMeal(MealPlan mealPlan,
                                      int dayIndex,
                                      LocalDate date,
                                      int mealsPerDay,
                                      int targetCalories,
                                      int targetProtein,
                                      int targetCarbs,
                                      int targetFat,
                                      Set<String> preferences,
                                      Set<String> allergies) {
        DailyMeal dailyMeal = DailyMeal.builder()
                .mealPlan(mealPlan)
                .dayDate(date)
                .dayIndex(dayIndex)
                .build();

        int caloriesPerMeal = Math.max(1, targetCalories / mealsPerDay);
        int proteinPerMeal = Math.max(1, targetProtein / mealsPerDay);
        int carbsPerMeal = Math.max(1, targetCarbs / mealsPerDay);
        int fatPerMeal = Math.max(1, targetFat / mealsPerDay);

        for (int mealNumber = 1; mealNumber <= mealsPerDay; mealNumber++) {
            MealType mealType = MealType.fromIndex(mealNumber, mealsPerDay);
            String tag = buildTagForMealType(mealType);
            List<FoodItem> candidates = foodItemRepository.findByTagAndNotAllergies(tag, allergies);
            FoodItem selected = selectFoodItem(candidates, preferences)
                    .orElseGet(() -> selectFoodItem(foodItemRepository.findByTagAndNotAllergies("balanced", allergies), preferences)
                            .orElseGet(() -> selectFoodItem(foodItemRepository.findAll(), preferences)
                                    .orElseThrow(() -> new NutritionException("Không tìm được món phù hợp cho " + mealType))));

            MealItem mealItem = buildMealItem(dailyMeal, selected, mealType, caloriesPerMeal, proteinPerMeal, carbsPerMeal, fatPerMeal);
            dailyMeal.getItems().add(mealItem);
        }

        return dailyMeal;
    }

    private String buildTagForMealType(MealType mealType) {
        switch (mealType) {
            case BREAKFAST:
                return "breakfast";
            case LUNCH:
                return "lunch";
            case DINNER:
                return "dinner";
            default:
                return "snack";
        }
    }

    private Optional<FoodItem> selectFoodItem(List<FoodItem> candidates, Set<String> preferences) {
        if (candidates == null || candidates.isEmpty()) {
            return Optional.empty();
        }
        if (preferences.isEmpty()) {
            return Optional.of(candidates.get(0));
        }
        return candidates.stream()
                .filter(item -> item.getTags().stream().anyMatch(preferences::contains))
                .findFirst()
                .or(() -> Optional.of(candidates.get(0)));
    }

    private MealItem buildMealItem(DailyMeal dailyMeal,
                                   FoodItem foodItem,
                                   MealType mealType,
                                   int calories,
                                   int protein,
                                   int carbs,
                                   int fat) {
        double quantity = estimateQuantity(foodItem, calories);

        return MealItem.builder()
                .dailyMeal(dailyMeal)
                .foodItem(foodItem)
                .customName(foodItem.getName())
                .quantity(quantity)
                .calories(calories)
                .protein(protein)
                .carbs(carbs)
                .fat(fat)
                .mealType(mealType)
                .eaten(false)
                .build();
    }

    private double estimateQuantity(FoodItem item, int targetCalories) {
        if (item.getCaloriesPer100g() == null || item.getCaloriesPer100g() <= 0) {
            return 100.0;
        }
        return (targetCalories / (double) item.getCaloriesPer100g()) * 100.0;
    }
}
