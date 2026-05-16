package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.entity.Food;
import com.tuan.nutritionservice.entity.FoodCategory;
import com.tuan.nutritionservice.entity.MealEntry;
import com.tuan.nutritionservice.entity.NutritionPlan;
import com.tuan.nutritionservice.entity.WaterEntry;
import com.tuan.nutritionservice.repository.FoodCategoryRepository;
import com.tuan.nutritionservice.repository.FoodRepository;
import com.tuan.nutritionservice.repository.MealEntryRepository;
import com.tuan.nutritionservice.repository.NutritionPlanRepository;
import com.tuan.nutritionservice.repository.WaterEntryRepository;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NutritionService {
    private static final Pattern NUMBER_PATTERN = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)");
    private static final Pattern GRAM_PATTERN = Pattern.compile("(\\d+(?:[\\.,]\\d+)?)\\s*(g|gram|grams|gam)\\b", Pattern.CASE_INSENSITIVE);

    private final NutritionPlanRepository plans;
    private final MealEntryRepository meals;
    private final WaterEntryRepository waterEntries;
    private final FoodRepository foods;
    private final FoodCategoryRepository categories;

    public NutritionService(NutritionPlanRepository plans,
                            MealEntryRepository meals,
                            WaterEntryRepository waterEntries,
                            FoodRepository foods,
                            FoodCategoryRepository categories) {
        this.plans = plans;
        this.meals = meals;
        this.waterEntries = waterEntries;
        this.foods = foods;
        this.categories = categories;
    }

    @Transactional(readOnly = true)
    public List<Food> foods(String query) {
        String needle = normalizeFoodText(query);
        List<Food> activeFoods = foods.findAllByActiveTrueOrderByNameAsc();
        if (needle.isBlank()) {
            return activeFoods;
        }
        return activeFoods.stream()
                .filter(food -> foodMatches(food, needle))
                .sorted(Comparator.comparingInt(food -> matchScore(food, needle)))
                .limit(20)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Food> adminFoods() {
        return foods.findAllByOrderByNameAsc();
    }

    @Transactional
    public Food createFood(FoodRequest request) {
        Food food = new Food();
        applyFoodRequest(food, request);
        return foods.save(food);
    }

    @Transactional
    public Food updateFood(Long foodId, FoodRequest request) {
        Food food = foods.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("Food not found: " + foodId));
        applyFoodRequest(food, request);
        return foods.save(food);
    }

    @Transactional
    public void deactivateFood(Long foodId) {
        Food food = foods.findById(foodId)
                .orElseThrow(() -> new IllegalArgumentException("Food not found: " + foodId));
        food.setActive(false);
        foods.save(food);
    }

    @Transactional
    public void deleteFood(Long foodId) {
        if (!foods.existsById(foodId)) throw new IllegalArgumentException("Food not found: " + foodId);
        foods.deleteById(foodId);
    }

    @Transactional(readOnly = true)
    public NutritionAdminOverview adminOverview() {
        LocalDate today = LocalDate.now();
        int todayCalories = meals.findByEatenAtBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay())
                .stream()
                .mapToInt(MealEntry::getCalories)
                .sum();
        return new NutritionAdminOverview(
                foods.count(),
                foods.countByActiveTrue(),
                meals.count(),
                plans.count(),
                meals.countDistinctUsers(),
                todayCalories
        );
    }

    @Transactional(readOnly = true)
    public List<MealEntry> recentMeals() {
        return meals.findTop30ByOrderByEatenAtDesc();
    }

    @Transactional(readOnly = true)
    public List<FoodCategory> listCategories() {
        return categories.findAllByOrderByNameAsc();
    }

    @Transactional
    public FoodCategory createCategory(CategoryRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("Tên danh mục không được để trống");
        }
        if (categories.findByNameIgnoreCase(request.name().trim()).isPresent()) {
            throw new IllegalArgumentException("Danh mục đã tồn tại: " + request.name());
        }
        FoodCategory cat = new FoodCategory();
        applyCategoryRequest(cat, request);
        return categories.save(cat);
    }

    @Transactional
    public FoodCategory updateCategory(Long id, CategoryRequest request) {
        FoodCategory cat = categories.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục: " + id));
        applyCategoryRequest(cat, request);
        return categories.save(cat);
    }

    @Transactional
    public void deleteCategory(Long id) {
        FoodCategory cat = categories.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục: " + id));
        foods.findAllByOrderByNameAsc().stream()
                .filter(f -> cat.equals(f.getFoodCategory()))
                .forEach(f -> { f.setFoodCategory(null); foods.save(f); });
        categories.delete(cat);
    }

    private void applyCategoryRequest(FoodCategory cat, CategoryRequest request) {
        if (request.name() != null && !request.name().isBlank()) cat.setName(request.name().trim());
        if (request.description() != null) cat.setDescription(request.description().trim());
        if (request.icon() != null) cat.setIcon(request.icon().trim());
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
        meal.setFoodId(request.foodId());
        meal.setServings(request.servings());
        meal.setServingSize(request.servingSize());
        meal.setEatenAt(request.eatenAt());
        meal.setCalories(Math.max(0, request.calories()));
        meal.setProteinGrams(Math.max(0, request.proteinGrams()));
        meal.setCarbsGrams(Math.max(0, request.carbsGrams()));
        meal.setFatGrams(Math.max(0, request.fatGrams()));
        return meals.save(meal);
    }

    @Transactional
    public MealEntry addMealFromFood(Long userId, FoodMealRequest request) {
        Food food = foods.findById(request.foodId())
                .orElseThrow(() -> new IllegalArgumentException("Food not found: " + request.foodId()));
        return meals.save(mealFromFood(userId, food, request.mealType(), request.servings(), request.customName(), request.eatenAt()));
    }

    @Transactional
    public MealEntry quickAddMeal(Long userId, QuickMealRequest request) {
        Food food = bestFoodMatch(request.query());
        double servings = request.servings() == null ? inferServings(request.query(), food) : sanitizeServings(request.servings());
        return meals.save(mealFromFood(userId, food, request.mealType(), servings, request.query(), request.eatenAt()));
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

    @Transactional(readOnly = true)
    public RecoverySuggestion recoverySuggestion(RecoveryRequest request) {
        int burned = request.calories() == null || request.calories() <= 0
                ? estimateCalories(request.sportType(), request.distanceMeters(), request.durationMinutes())
                : request.calories();
        int targetCalories = clamp((int) Math.round(burned * 0.55), 280, 850);
        int carbs = clamp((int) Math.round(targetCalories * 0.58 / 4), 45, 140);
        int protein = request.sportType() != null && request.sportType().equalsIgnoreCase("SWIM") ? 30 : 28;
        if (burned >= 650) {
            protein = 35;
        }
        List<String> ideas = burned >= 650
                ? List.of("Com trang + uc ga + chuoi", "Pho bo them trung", "Bun bo + sua chua Hy Lap")
                : List.of("Chuoi + whey protein", "Trung ga + com trang", "Sua chua Hy Lap + chuoi");
        String message = burned >= 650
                ? "Buoi tap tieu hao cao. Nen bo sung carb de nap glycogen va them protein trong 60-90 phut sau tap."
                : "Buoi tap vua phai. Uu tien mot bua nhe co carb de hoi phuc va protein de ho tro co bap.";
        return new RecoverySuggestion(message, burned, targetCalories, protein, carbs, ideas);
    }

    public List<FoodSuggestion> library() {
        return List.of(
                new FoodSuggestion("Pre-run banana toast", "BEFORE_RUN", 310, "Carbs, a little protein, easy digestion."),
                new FoodSuggestion("Recovery rice bowl", "AFTER_RUN", 640, "Rice, lean protein, vegetables, sodium."),
                new FoodSuggestion("Pool-session smoothie", "AFTER_SWIM", 420, "Milk, banana, oats, whey or yogurt."),
                new FoodSuggestion("Long day hydration", "HYDRATION", 120, "Electrolytes and 500-750ml fluid per hour.")
        );
    }

    private MealEntry mealFromFood(Long userId, Food food, String mealType, Double requestedServings, String customName, LocalDateTime eatenAt) {
        double servings = sanitizeServings(requestedServings);
        MealEntry meal = new MealEntry();
        meal.setUserId(userId);
        meal.setMealType(defaultText(mealType, "SNACK").toUpperCase());
        meal.setName(defaultText(customName, food.getName()));
        meal.setFoodId(food.getId());
        meal.setServings(servings);
        meal.setServingSize(food.getServingSize());
        meal.setEatenAt(eatenAt);
        meal.setCalories(scale(food.getCalories(), servings));
        meal.setProteinGrams(scale(food.getProteinGrams(), servings));
        meal.setCarbsGrams(scale(food.getCarbsGrams(), servings));
        meal.setFatGrams(scale(food.getFatGrams(), servings));
        return meal;
    }

    private Food bestFoodMatch(String query) {
        String needle = normalizeFoodText(query);
        if (needle.isBlank()) {
            throw new IllegalArgumentException("Please enter a food name");
        }
        return foods.findAllByActiveTrueOrderByNameAsc().stream()
                .filter(food -> foodMatches(food, needle))
                .min(Comparator.comparingInt(food -> matchScore(food, needle)))
                .orElseThrow(() -> new IllegalArgumentException("Food not found in library: " + query));
    }

    private boolean foodMatches(Food food, String needle) {
        String name = normalizeFoodText(food.getName());
        String aliases = normalizeFoodText(food.getAliases());
        return name.contains(needle)
                || aliases.contains(needle)
                || needle.contains(name)
                || (!aliases.isBlank() && needle.contains(aliases));
    }

    private int matchScore(Food food, String needle) {
        String name = normalizeFoodText(food.getName());
        String aliases = normalizeFoodText(food.getAliases());
        if (name.equals(needle)) return 0;
        if (aliases.equals(needle)) return 1;
        if (name.startsWith(needle) || needle.startsWith(name)) return 2;
        if (aliases.contains(needle)) return 3;
        return 4;
    }

    private double inferServings(String query, Food food) {
        String raw = query == null ? "" : query;
        Matcher gramMatcher = GRAM_PATTERN.matcher(raw);
        if (gramMatcher.find()) {
            Double grams = parseDouble(gramMatcher.group(1));
            Double servingGrams = gramsFromServing(food.getServingSize());
            if (grams != null && servingGrams != null && servingGrams > 0) {
                return sanitizeServings(grams / servingGrams);
            }
        }
        Matcher matcher = NUMBER_PATTERN.matcher(raw);
        if (matcher.find()) {
            Double servings = parseDouble(matcher.group(1));
            if (servings != null) {
                return sanitizeServings(servings);
            }
        }
        return 1.0;
    }

    private Double gramsFromServing(String servingSize) {
        if (servingSize == null) return null;
        Matcher matcher = GRAM_PATTERN.matcher(servingSize);
        return matcher.find() ? parseDouble(matcher.group(1)) : null;
    }

    private Double parseDouble(String value) {
        try {
            return Double.parseDouble(value.replace(",", "."));
        } catch (Exception ex) {
            return null;
        }
    }

    private int estimateCalories(String sportType, Double distanceMeters, Integer durationMinutes) {
        if (distanceMeters != null && distanceMeters > 0) {
            double km = distanceMeters / 1000.0;
            if (sportType != null && sportType.equalsIgnoreCase("SWIM")) {
                return (int) Math.round(km * 280);
            }
            return (int) Math.round(km * 70);
        }
        if (durationMinutes != null && durationMinutes > 0) {
            return durationMinutes * 8;
        }
        return 360;
    }

    private void applyFoodRequest(Food food, FoodRequest request) {
        food.setName(defaultText(request.name(), food.getName() == null ? "Food" : food.getName()));
        if (request.categoryId() != null) {
            FoodCategory cat = categories.findById(request.categoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy danh mục: " + request.categoryId()));
            food.setFoodCategory(cat);
            food.setCategory(cat.getName());
        }
        food.setServingSize(defaultText(request.servingSize(), food.getServingSize() == null ? "1 serving" : food.getServingSize()));
        food.setCalories(Math.max(0, request.calories() == null ? food.getCalories() : request.calories()));
        food.setProteinGrams(Math.max(0, request.proteinGrams() == null ? food.getProteinGrams() : request.proteinGrams()));
        food.setCarbsGrams(Math.max(0, request.carbsGrams() == null ? food.getCarbsGrams() : request.carbsGrams()));
        food.setFatGrams(Math.max(0, request.fatGrams() == null ? food.getFatGrams() : request.fatGrams()));
        food.setAliases(defaultText(request.aliases(), food.getAliases() == null ? "" : food.getAliases()));
        food.setNote(defaultText(request.note(), food.getNote() == null ? "" : food.getNote()));
        food.setImageUrl(defaultText(request.imageUrl(), food.getImageUrl() == null ? "" : food.getImageUrl()));
        food.setActive(request.active() == null || request.active());
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

    private String normalizeFoodText(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = Normalizer.normalize(value.toLowerCase(Locale.ROOT).replace('đ', 'd'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-z0-9\\s.,]", " ");
        normalized = normalized.replaceAll("\\b\\d+(?:[\\.,]\\d+)?\\b", " ");
        normalized = normalized.replaceAll("\\b(to|qua|trai|chen|dia|suat|khau phan|ly|goi|muong|thia|bat|g|gram|grams|gam|kg|ml)\\b", " ");
        return normalized.replaceAll("\\s+", " ").trim();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private double sanitizeServings(Double servings) {
        if (servings == null || servings <= 0) {
            return 1.0;
        }
        return Math.min(10.0, Math.round(servings * 100.0) / 100.0);
    }

    private int scale(int value, double servings) {
        return Math.max(0, (int) Math.round(value * servings));
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
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
            Long foodId,
            Double servings,
            String servingSize,
            LocalDateTime eatenAt,
            int calories,
            int proteinGrams,
            int carbsGrams,
            int fatGrams
    ) {
    }

    public record FoodMealRequest(
            Long foodId,
            String mealType,
            Double servings,
            String customName,
            LocalDateTime eatenAt
    ) {
    }

    public record QuickMealRequest(
            String query,
            String mealType,
            Double servings,
            LocalDateTime eatenAt
    ) {
    }

    public record NutritionSummary(int calories, int proteinGrams, int carbsGrams, int fatGrams) {
    }

    public record FoodSuggestion(String name, String timing, int calories, String note) {
    }

    public record RecoveryRequest(
            Long userId,
            String sportType,
            Double distanceMeters,
            Integer durationMinutes,
            Integer calories
    ) {
    }

    public record RecoverySuggestion(
            String message,
            int burnedCalories,
            int targetCalories,
            int targetProteinGrams,
            int targetCarbsGrams,
            List<String> mealIdeas
    ) {
    }

    public record FoodRequest(
            String name,
            Long categoryId,
            String servingSize,
            Integer calories,
            Integer proteinGrams,
            Integer carbsGrams,
            Integer fatGrams,
            String aliases,
            String note,
            String imageUrl,
            Boolean active
    ) {
    }

    public record CategoryRequest(String name, String description, String icon) {
    }

    public record NutritionAdminOverview(
            long totalFoods,
            long activeFoods,
            long mealsLogged,
            long usersWithPlans,
            long usersLoggedMeals,
            int caloriesToday
    ) {
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

    public record DailyStats(String date, int calories, int proteinGrams, int carbsGrams, int fatGrams) {
    }

    @Transactional(readOnly = true)
    public List<DailyStats> weeklyAnalytics(Long userId) {
        LocalDate today = LocalDate.now();
        List<DailyStats> result = new java.util.ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            List<MealEntry> dayMeals = meals.findByUserIdAndEatenAtBetween(userId, day.atStartOfDay(), day.plusDays(1).atStartOfDay());
            result.add(new DailyStats(
                    day.toString(),
                    dayMeals.stream().mapToInt(MealEntry::getCalories).sum(),
                    dayMeals.stream().mapToInt(MealEntry::getProteinGrams).sum(),
                    dayMeals.stream().mapToInt(MealEntry::getCarbsGrams).sum(),
                    dayMeals.stream().mapToInt(MealEntry::getFatGrams).sum()
            ));
        }
        return result;
    }
}
