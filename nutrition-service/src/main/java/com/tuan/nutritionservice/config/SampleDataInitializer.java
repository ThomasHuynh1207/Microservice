package com.tuan.nutritionservice.config;

import com.tuan.nutritionservice.entity.MealEntry;
import com.tuan.nutritionservice.entity.NutritionPlan;
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
    CommandLineRunner seedNutrition(NutritionPlanRepository plans, MealEntryRepository meals) {
        return args -> {
            if (plans.count() == 0) {
                NutritionPlan plan = new NutritionPlan();
                plan.setUserId(1L);
                plan.setGoal("Support 4 run days and 3 swim sessions per week.");
                plan.setDailyCalories(2500);
                plan.setProteinGrams(140);
                plan.setCarbsGrams(350);
                plan.setFatGrams(68);
                plan.setHydrationLiters(3.0);
                plan.setGuidance("Eat a carb-forward meal 2-3 hours before quality runs, and recover with protein after swims.");
                plans.save(plan);
            }
            if (meals.count() == 0) {
                meals.saveAll(List.of(
                        meal(1L, "BREAKFAST", "Oats, banana, yogurt", 520, 28, 78, 14),
                        meal(1L, "LUNCH", "Chicken rice bowl", 720, 42, 92, 21),
                        meal(1L, "SNACK", "Chocolate milk recovery", 260, 18, 34, 6)
                ));
            }
        };
    }

    private MealEntry meal(Long userId, String type, String name, int calories, int protein, int carbs, int fat) {
        MealEntry meal = new MealEntry();
        meal.setUserId(userId);
        meal.setMealType(type);
        meal.setName(name);
        meal.setCalories(calories);
        meal.setProteinGrams(protein);
        meal.setCarbsGrams(carbs);
        meal.setFatGrams(fat);
        meal.setEatenAt(LocalDateTime.now().minusHours(calories % 7));
        return meal;
    }
}
