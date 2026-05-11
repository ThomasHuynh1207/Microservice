package com.tuan.nutritionservice.config;

import com.tuan.nutritionservice.entity.Food;
import com.tuan.nutritionservice.entity.MealEntry;
import com.tuan.nutritionservice.entity.NutritionPlan;
import com.tuan.nutritionservice.repository.FoodRepository;
import com.tuan.nutritionservice.repository.MealEntryRepository;
import com.tuan.nutritionservice.repository.NutritionPlanRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedNutrition(NutritionPlanRepository plans, MealEntryRepository meals, FoodRepository foods) {
        return args -> {
            seedFood(foods, food("Pho bo", "MEAL", "1 to", 520, 28, 65, 16,
                    "pho bo beef noodle soup to pho", "Good after a longer run when sodium and carbs are useful."));
            seedFood(foods, food("Com tam suon", "MEAL", "1 dia", 760, 34, 96, 24,
                    "com tam suon rice pork dia com tam", "High energy Vietnamese lunch."));
            seedFood(foods, food("Bun bo", "MEAL", "1 to", 610, 31, 78, 18,
                    "bun bo beef noodle spicy soup", "Good carb-heavy meal after endurance sessions."));
            seedFood(foods, food("Trung ga", "PROTEIN", "1 qua", 70, 6, 1, 5,
                    "trung ga qua trung egg eggs", "Simple protein source."));
            seedFood(foods, food("Chuoi", "CARB", "1 trai", 105, 1, 27, 0,
                    "chuoi banana trai chuoi", "Easy pre-run or post-run carb."));
            seedFood(foods, food("Whey protein", "PROTEIN", "1 scoop 30g", 120, 24, 3, 2,
                    "whey protein scoop bot whey", "Convenient post-workout protein."));
            seedFood(foods, food("Uc ga", "PROTEIN", "100g", 165, 31, 0, 4,
                    "uc ga chicken breast ga", "Lean protein for recovery meals."));
            seedFood(foods, food("Com trang", "CARB", "100g", 130, 3, 28, 0,
                    "com trang rice white rice", "Simple carb base for recovery meals."));
            seedFood(foods, food("Sua chua Hy Lap", "PROTEIN", "170g", 150, 15, 12, 4,
                    "sua chua hy lap greek yogurt yogurt", "Protein snack."));
            seedFood(foods, food("Banh mi trung", "MEAL", "1 o", 430, 18, 58, 14,
                    "banh mi trung sandwich egg", "Practical breakfast before an easy day."));

            seedPlan(plans, 1L, "Support 4 run days and 3 swim sessions per week.", 2500, 140, 350, 68, 3.0);
            seedPlan(plans, 2L, "Fuel bridge repeats and steady weekday runs.", 2350, 125, 320, 65, 2.7);
            seedPlan(plans, 3L, "Recover from swim volume while keeping meals light.", 2300, 135, 285, 72, 3.1);
            seedPlan(plans, 4L, "Support weight control with enough protein.", 2100, 130, 245, 62, 2.5);
            seedPlan(plans, 5L, "Build consistent swim endurance and recovery.", 2400, 135, 315, 70, 3.0);

            if (meals.count() == 0) {
                meals.saveAll(List.of(
                        meal(1L, "BREAKFAST", "Oats, banana, yogurt", null, 1.0, "1 bowl", 520, 28, 78, 14),
                        meal(1L, "LUNCH", "Chicken rice bowl", null, 1.0, "1 bowl", 720, 42, 92, 21),
                        meal(2L, "DINNER", "Pho bo", null, 1.0, "1 to", 520, 28, 65, 16),
                        meal(3L, "SNACK", "Whey protein + chuoi", null, 1.0, "1 serving", 225, 25, 30, 2),
                        meal(4L, "LUNCH", "Com tam suon", null, 1.0, "1 dia", 760, 34, 96, 24),
                        meal(5L, "SNACK", "Sua chua Hy Lap", null, 1.0, "170g", 150, 15, 12, 4)
                ));
            }
        };
    }

    private void seedPlan(NutritionPlanRepository plans, Long userId, String goal, int calories, int protein,
                          int carbs, int fat, double hydration) {
        if (plans.findByUserId(userId).isPresent()) {
            return;
        }
        NutritionPlan plan = new NutritionPlan();
        plan.setUserId(userId);
        plan.setGoal(goal);
        plan.setDailyCalories(calories);
        plan.setProteinGrams(protein);
        plan.setCarbsGrams(carbs);
        plan.setFatGrams(fat);
        plan.setHydrationLiters(hydration);
        plan.setGuidance("Prioritize carbs near training, protein after workouts, and steady hydration through the day.");
        plans.save(plan);
    }

    private void seedFood(FoodRepository foods, Food food) {
        if (!foods.existsByNameIgnoreCase(food.getName())) {
            foods.save(food);
        }
    }

    private Food food(String name, String category, String servingSize, int calories, int protein,
                      int carbs, int fat, String aliases, String note) {
        Food food = new Food();
        food.setName(name);
        food.setCategory(category);
        food.setServingSize(servingSize);
        food.setCalories(calories);
        food.setProteinGrams(protein);
        food.setCarbsGrams(carbs);
        food.setFatGrams(fat);
        food.setAliases(aliases);
        food.setNote(note);
        food.setActive(true);
        return food;
    }

    private MealEntry meal(Long userId, String type, String name, Long foodId, Double servings, String servingSize,
                           int calories, int protein, int carbs, int fat) {
        MealEntry meal = new MealEntry();
        meal.setUserId(userId);
        meal.setMealType(type);
        meal.setName(name);
        meal.setFoodId(foodId);
        meal.setServings(servings);
        meal.setServingSize(servingSize);
        meal.setCalories(calories);
        meal.setProteinGrams(protein);
        meal.setCarbsGrams(carbs);
        meal.setFatGrams(fat);
        meal.setEatenAt(LocalDateTime.now().minusHours(calories % 7));
        return meal;
    }
}
