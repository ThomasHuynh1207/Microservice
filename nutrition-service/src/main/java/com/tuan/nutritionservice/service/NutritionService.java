package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.entity.MealEntry;
import com.tuan.nutritionservice.entity.NutritionPlan;
import com.tuan.nutritionservice.entity.WaterEntry;
import com.tuan.nutritionservice.repository.MealEntryRepository;
import com.tuan.nutritionservice.repository.NutritionPlanRepository;
import com.tuan.nutritionservice.repository.WaterEntryRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NutritionService {
    private final NutritionPlanRepository plans;
    private final MealEntryRepository meals;
    private final WaterEntryRepository waterEntries;

    public NutritionService(NutritionPlanRepository plans, MealEntryRepository meals, WaterEntryRepository waterEntries) {
        this.plans = plans;
        this.meals = meals;
        this.waterEntries = waterEntries;
    }

    @Transactional
    public NutritionPlan getOrCreatePlan(Long userId) {
        return plans.findByUserId(userId).orElseGet(() -> plans.save(defaultPlan(userId)));
    }

    @Transactional
    public NutritionPlan updatePlan(Long userId, NutritionPlanRequest request) {
        NutritionPlan plan = plans.findByUserId(userId).orElseGet(() -> defaultPlan(userId));
        plan.setGoal(defaultText(request.goal(), plan.getGoal()));
        plan.setDailyCalories(request.dailyCalories() == null ? plan.getDailyCalories() : request.dailyCalories());
        plan.setProteinGrams(request.proteinGrams() == null ? plan.getProteinGrams() : request.proteinGrams());
        plan.setCarbsGrams(request.carbsGrams() == null ? plan.getCarbsGrams() : request.carbsGrams());
        plan.setFatGrams(request.fatGrams() == null ? plan.getFatGrams() : request.fatGrams());
        plan.setHydrationLiters(request.hydrationLiters() == null ? plan.getHydrationLiters() : request.hydrationLiters());
        plan.setGuidance(defaultText(request.guidance(), plan.getGuidance()));
        return plans.save(plan);
    }

    @Transactional(readOnly = true)
    public List<MealEntry> meals(Long userId) {
        return meals.findByUserIdOrderByEatenAtDesc(userId);
    }

    @Transactional
    public MealEntry addMeal(MealEntryRequest request) {
        MealEntry meal = new MealEntry();
        meal.setUserId(request.userId());
        meal.setMealType(defaultText(request.mealType(), "SNACK").toUpperCase());
        meal.setName(defaultText(request.name(), "Training meal"));
        meal.setEatenAt(request.eatenAt());
        meal.setCalories(request.calories());
        meal.setProteinGrams(request.proteinGrams());
        meal.setCarbsGrams(request.carbsGrams());
        meal.setFatGrams(request.fatGrams());
        return meals.save(meal);
    }

    @Transactional(readOnly = true)
    public NutritionSummary summary(Long userId) {
        LocalDate today = LocalDate.now();
        List<MealEntry> todayMeals = meals.findByUserIdAndEatenAtBetween(userId, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        return new NutritionSummary(
                todayMeals.stream().mapToInt(MealEntry::getCalories).sum(),
                todayMeals.stream().mapToInt(MealEntry::getProteinGrams).sum(),
                todayMeals.stream().mapToInt(MealEntry::getCarbsGrams).sum(),
                todayMeals.stream().mapToInt(MealEntry::getFatGrams).sum()
        );
    }

    public List<FoodSuggestion> library() {
        return List.of(
                new FoodSuggestion("Pre-run banana toast", "BEFORE_RUN", 310, "Carbs, a little protein, easy digestion."),
                new FoodSuggestion("Recovery rice bowl", "AFTER_RUN", 640, "Rice, lean protein, vegetables, sodium."),
                new FoodSuggestion("Pool-session smoothie", "AFTER_SWIM", 420, "Milk, banana, oats, whey or yogurt."),
                new FoodSuggestion("Long day hydration", "HYDRATION", 120, "Electrolytes and 500-750ml fluid per hour.")
        );
    }

    private NutritionPlan defaultPlan(Long userId) {
        NutritionPlan plan = new NutritionPlan();
        plan.setUserId(userId);
        plan.setGoal("Fuel run and swim training without feeling heavy.");
        plan.setDailyCalories(2450);
        plan.setProteinGrams(135);
        plan.setCarbsGrams(330);
        plan.setFatGrams(70);
        plan.setHydrationLiters(2.8);
        plan.setGuidance("Prioritize carbs around run days, protein after swim sessions, and consistent hydration.");
        return plan;
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    public record NutritionPlanRequest(
            String goal,
            Integer dailyCalories,
            Integer proteinGrams,
            Integer carbsGrams,
            Integer fatGrams,
            Double hydrationLiters,
            String guidance
    ) {
    }

    public record MealEntryRequest(
            Long userId,
            String mealType,
            String name,
            LocalDateTime eatenAt,
            int calories,
            int proteinGrams,
            int carbsGrams,
            int fatGrams
    ) {
    }

    public record NutritionSummary(int calories, int proteinGrams, int carbsGrams, int fatGrams) {
    }

    public record FoodSuggestion(String name, String timing, int calories, String note) {
    }

    @Transactional
    public WaterEntry logWater(Long userId, WaterRequest request) {
        WaterEntry entry = new WaterEntry();
        entry.setUserId(userId);
        entry.setAmountMl(request.amountMl());
        return waterEntries.save(entry);
    }

    @Transactional(readOnly = true)
    public WaterSummary waterToday(Long userId) {
        LocalDate today = LocalDate.now();
        List<WaterEntry> entries = waterEntries.findByUserIdAndLoggedAtBetween(
                userId, today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        int totalMl = entries.stream().mapToInt(WaterEntry::getAmountMl).sum();
        return new WaterSummary(totalMl, entries);
    }

    public record WaterRequest(int amountMl) {
    }

    public record WaterSummary(int totalMl, List<WaterEntry> entries) {
    }
}
