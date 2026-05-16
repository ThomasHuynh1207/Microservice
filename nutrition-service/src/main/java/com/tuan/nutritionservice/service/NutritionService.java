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
import java.util.ArrayList;
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

    @Transactional
    public NutritionPlan autoCalculatePlan(Long userId, AutoCalculateRequest req) {
        if (req.heightCm() <= 0 || req.weightKg() <= 0)
            throw new IllegalArgumentException("Chiều cao và cân nặng phải lớn hơn 0");

        // Age from dateOfBirth
        int age = 25;
        if (req.dateOfBirth() != null && !req.dateOfBirth().isBlank()) {
            try {
                LocalDate dob = LocalDate.parse(req.dateOfBirth());
                age = LocalDate.now().getYear() - dob.getYear();
                if (LocalDate.now().getDayOfYear() < dob.getDayOfYear()) age--;
                age = Math.max(15, Math.min(80, age));
            } catch (Exception ignored) {}
        }

        // BMR — Mifflin-St Jeor
        boolean isMale = req.gender() == null || !req.gender().equalsIgnoreCase("Nữ");
        double bmr = 10 * req.weightKg() + 6.25 * req.heightCm() - 5 * age + (isMale ? 5 : -161);

        // TDEE — activity factor from experience level
        double activity = switch (req.experienceLevel() == null ? "" : req.experienceLevel().toUpperCase()) {
            case "ADVANCED"     -> 1.725;
            case "INTERMEDIATE" -> 1.55;
            default             -> 1.375;
        };
        double tdee = bmr * activity;

        // Goal adjustment
        String goalLower = req.primaryGoal() == null ? "" : req.primaryGoal().toLowerCase();
        if (goalLower.contains("gi") && (goalLower.contains("m c") || goalLower.contains("m cân"))) {
            tdee -= 500; // weight-loss deficit
        } else if (goalLower.contains("t") && goalLower.contains("ng c")) {
            tdee += 300; // muscle-gain surplus
        }

        int dailyCalories = Math.max(1200, (int) (Math.round(tdee / 50.0) * 50));

        // Macros — athlete-oriented
        int protein = (int) Math.round(req.weightKg() * 1.6);
        int fat     = (int) Math.round(dailyCalories * 0.25 / 9);
        int carbs   = Math.max(100, (int) Math.round((dailyCalories - protein * 4 - fat * 9) / 4.0));

        // Hydration — 35ml/kg body weight
        double hydration = Math.round(Math.max(2.0, req.weightKg() * 0.035) * 10) / 10.0;

        // BMI label
        double bmi = req.weightKg() / Math.pow(req.heightCm() / 100.0, 2);
        String bmiLabel = bmi < 18.5 ? "Thiếu cân" : bmi < 25 ? "Bình thường" : bmi < 30 ? "Thừa cân" : "Béo phì";
        String goalText = req.primaryGoal() != null && !req.primaryGoal().isBlank() ? req.primaryGoal() : "Duy trì sức khỏe";
        String goalDesc = String.format("Mục tiêu: %s. BMI %.1f (%s). TDEE %.0f kcal/ngày.", goalText, bmi, bmiLabel, tdee);

        String guidance;
        if (goalLower.contains("gi") && goalLower.contains("m")) {
            guidance = String.format("Thiếu hụt 500 kcal so với TDEE giúp giảm ~0.5kg/tuần. Protein %dg/ngày để giữ cơ. Ưu tiên rau xanh, hạn chế đường và tinh bột tinh chế.", protein);
        } else if (goalLower.contains("t") && goalLower.contains("ng")) {
            guidance = String.format("Dư thừa 300 kcal để tăng cơ từ từ. Protein %dg/ngày, phân chia 4-5 bữa. Carb cao trước buổi tập để tối ưu hiệu suất.", protein);
        } else {
            guidance = String.format("Duy trì %d kcal mỗi ngày. Phân bổ đều macro qua các bữa. Ưu tiên thực phẩm nguyên chất và bổ sung đủ nước mỗi ngày.", dailyCalories);
        }

        NutritionPlan plan = plans.findByUserId(userId).orElseGet(() -> defaultPlan(userId));
        plan.setGoal(goalDesc);
        plan.setDailyCalories(dailyCalories);
        plan.setProteinGrams(protein);
        plan.setCarbsGrams(carbs);
        plan.setFatGrams(fat);
        plan.setHydrationLiters(hydration);
        plan.setGuidance(guidance);
        return plans.save(plan);
    }

    @Transactional
    public NutritionRecommendation recommendation(Long userId, int caloriesBurned) {
        NutritionPlan plan = getOrCreatePlan(userId);
        NutritionSummary today = summary(userId);

        // Net target increases by calories burned (need to eat back exercise calories)
        int netTarget = plan.getDailyCalories() + Math.max(0, caloriesBurned);
        int remCal  = netTarget         - today.calories();
        int remPro  = plan.getProteinGrams()  - today.proteinGrams();
        int remCarb = plan.getCarbsGrams()    - today.carbsGrams();
        int remFat  = plan.getFatGrams()      - today.fatGrams();
        double pct  = netTarget > 0 ? Math.min(100, today.calories() * 100.0 / netTarget) : 0;

        List<String> alerts = new ArrayList<>();

        // Activity-aware alerts
        if (caloriesBurned >= 600) {
            alerts.add(String.format("Bạn đã đốt %d kcal hôm nay — hãy bổ sung thêm tinh bột và protein phục hồi cơ.", caloriesBurned));
        } else if (caloriesBurned >= 300) {
            alerts.add(String.format("Vận động tốt! Đã đốt %d kcal — đừng quên bù protein sau buổi tập.", caloriesBurned));
        } else if (caloriesBurned == 0 && today.calories() > plan.getDailyCalories() / 2) {
            alerts.add("Hôm nay ít vận động — cân nhắc giảm tinh bột trong bữa tối.");
        }

        // Food intake alerts
        if (today.calories() == 0) {
            alerts.add("Chưa có bữa ăn nào hôm nay. Đừng quên nạp năng lượng!");
        } else if (remCal < -300) {
            alerts.add("Bạn đã vượt " + Math.abs(remCal) + " kcal so với mục tiêu. Chú ý bữa tiếp theo.");
        } else if (remCal > 0 && remCal <= 200) {
            alerts.add("Gần đạt mục tiêu! Chỉ còn " + remCal + " kcal.");
        }
        if (remPro > 25)  alerts.add("Thiếu " + remPro + "g protein — gợi ý: ức gà, trứng luộc, đậu hũ.");
        if (remCarb > 60 && remCal > 0) alerts.add("Thiếu " + remCarb + "g carb — gợi ý: cơm trắng, chuối, yến mạch.");

        List<Food> suggestions = suggestFoods(remPro, remCarb, remCal, caloriesBurned);

        return new NutritionRecommendation(
                plan.getDailyCalories(), plan.getProteinGrams(), plan.getCarbsGrams(), plan.getFatGrams(),
                today.calories(), today.proteinGrams(), today.carbsGrams(), today.fatGrams(),
                remCal, remPro, remCarb, remFat, caloriesBurned, netTarget, pct, alerts, suggestions);
    }

    @Transactional
    public void deleteMeal(Long userId, Long mealId) {
        MealEntry meal = meals.findById(mealId)
                .orElseThrow(() -> new IllegalArgumentException("Bữa ăn không tồn tại: " + mealId));
        if (!meal.getUserId().equals(userId))
            throw new IllegalArgumentException("Không có quyền xóa bữa ăn này");
        meals.deleteById(mealId);
    }

    private List<Food> suggestFoods(int remPro, int remCarb, int remCal, int caloriesBurned) {
        if (remCal <= 0) return List.of();
        int calCap = Math.max(200, Math.min(remCal, 900));
        boolean highActivity = caloriesBurned >= 400;
        return foods.findAllByActiveTrueOrderByNameAsc().stream()
                .filter(f -> f.getCalories() > 0 && f.getCalories() <= calCap)
                .sorted(Comparator.comparingDouble((Food f) -> {
                    double score = 0;
                    if (remPro  > 20 || highActivity) score += f.getProteinGrams() * 3.5;
                    if (remCarb > 40 || highActivity) score += f.getCarbsGrams()   * 1.8;
                    score += f.getCalories() * 0.03;
                    return -score;
                }))
                .limit(4)
                .toList();
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
                ? List.of("Cơm trắng + ức gà + chuối", "Phở bò thêm trứng", "Bún bò + sữa chua Hy Lạp")
                : List.of("Chuối + whey protein", "Trứng gà + cơm trắng", "Sữa chua Hy Lạp + chuối");
        String message = burned >= 650
                ? "Buổi tập tiêu hao cao. Hãy bổ sung carb để nạp lại glycogen và thêm protein trong 60–90 phút sau tập."
                : "Buổi tập vừa phải. Ưu tiên bữa nhẹ có carb để phục hồi và protein để hỗ trợ cơ bắp.";
        return new RecoverySuggestion(message, burned, targetCalories, protein, carbs, ideas);
    }

    public List<FoodSuggestion> library() {
        return List.of(
                new FoodSuggestion("Chuối + bánh mì đen", "TRƯỚC_TẬP", 310, "Carb chậm + đường tự nhiên, dễ tiêu hóa trước khi chạy."),
                new FoodSuggestion("Cơm trắng + ức gà + rau xanh", "SAU_TẬP", 640, "Phục hồi glycogen và protein cơ sau bài tập dài."),
                new FoodSuggestion("Sinh tố phục hồi sau bơi", "SAU_BƠI", 420, "Sữa tươi + chuối + yến mạch, nhanh phục hồi năng lượng."),
                new FoodSuggestion("Nước dừa tươi", "BỔ_SUNG_NƯỚC", 120, "Điện giải tự nhiên, bổ sung 500-750ml mỗi giờ vận động.")
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
        plan.setGoal("Duy trì sức khỏe và hỗ trợ luyện tập chạy bộ & bơi lội.");
        plan.setDailyCalories(2450);
        plan.setProteinGrams(135);
        plan.setCarbsGrams(330);
        plan.setFatGrams(70);
        plan.setHydrationLiters(2.8);
        plan.setGuidance("Ưu tiên carb trước buổi chạy, bổ sung protein sau bơi và uống đủ nước mỗi ngày. Dùng nút Thiết lập thông minh để tính kế hoạch cá nhân hóa theo hồ sơ của bạn.");
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

    public record AutoCalculateRequest(
            String gender,
            String dateOfBirth,
            double heightCm,
            double weightKg,
            String primaryGoal,
            String experienceLevel
    ) {}

    public record NutritionRecommendation(
            int targetCalories, int targetProtein, int targetCarbs, int targetFat,
            int consumedCalories, int consumedProtein, int consumedCarbs, int consumedFat,
            int remainingCalories, int remainingProtein, int remainingCarbs, int remainingFat,
            int caloriesBurned,
            int netCaloriesTarget,
            double completionPercent,
            List<String> alerts,
            List<Food> suggestedFoods
    ) {}

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
