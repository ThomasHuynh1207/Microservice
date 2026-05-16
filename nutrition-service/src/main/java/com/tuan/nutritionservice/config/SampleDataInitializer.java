package com.tuan.nutritionservice.config;

import com.tuan.nutritionservice.entity.Food;
import com.tuan.nutritionservice.entity.FoodCategory;
import com.tuan.nutritionservice.entity.MealEntry;
import com.tuan.nutritionservice.entity.NutritionPlan;
import com.tuan.nutritionservice.repository.FoodCategoryRepository;
import com.tuan.nutritionservice.repository.FoodRepository;
import com.tuan.nutritionservice.repository.MealEntryRepository;
import com.tuan.nutritionservice.repository.NutritionPlanRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {

    @Bean
    CommandLineRunner seedNutrition(NutritionPlanRepository plans, MealEntryRepository meals,
                                    FoodRepository foods, FoodCategoryRepository cats) {
        return args -> {
            // 1. Seed categories
            FoodCategory buaChinhCat = seedCategory(cats, "Bữa chính", "Bữa ăn chính trong ngày", "🍚");
            FoodCategory carbCat     = seedCategory(cats, "Carb",       "Tinh bột & nguồn carbohydrate", "🌾");
            FoodCategory proteinCat  = seedCategory(cats, "Protein",    "Thực phẩm giàu đạm", "🥩");
            FoodCategory snackCat    = seedCategory(cats, "Ăn nhẹ",    "Bữa phụ & đồ ăn nhẹ", "🥗");
            FoodCategory drinkCat    = seedCategory(cats, "Đồ uống",   "Thức uống & sữa", "🥤");

            // 2. Migrate existing foods with text category but no category_id
            Map<String, FoodCategory> legacyMap = Map.of(
                "MEAL",    buaChinhCat, "CARB",    carbCat,
                "PROTEIN", proteinCat,  "SNACK",   snackCat,
                "DRINK",   drinkCat,
                "Bữa chính", buaChinhCat, "Carb",  carbCat,
                "Protein",   proteinCat,  "Ăn nhẹ", snackCat,
                "Đồ uống",  drinkCat
            );
            foods.findAllByOrderByNameAsc().stream()
                    .filter(f -> f.getFoodCategory() == null)
                    .forEach(f -> {
                        FoodCategory cat = legacyMap.get(f.getCategory());
                        if (cat != null) { f.setFoodCategory(cat); foods.save(f); }
                    });

            // 3. Fix unaccented names from old seeds
            fixFoodName(foods, "Pho bo",         "Phở bò");
            fixFoodName(foods, "Com tam suon",    "Cơm tấm sườn");
            fixFoodName(foods, "Bun bo Hue",      "Bún bò Huế");
            fixFoodName(foods, "Bun bo",          "Bún bò Huế");
            fixFoodName(foods, "Trung ga luoc",   "Trứng gà luộc");
            fixFoodName(foods, "Chuoi",           "Chuối");
            fixFoodName(foods, "Uc ga nuong",     "Ức gà nướng");
            fixFoodName(foods, "Com trang",       "Cơm trắng");
            fixFoodName(foods, "Sua chua Hy Lap", "Sữa chua Hy Lạp");
            fixFoodName(foods, "Banh mi trung",   "Bánh mì trứng");
            fixFoodName(foods, "Yen mach",        "Yến mạch");
            fixFoodName(foods, "Yến mach",        "Yến mạch");
            fixFoodName(foods, "Ca hoi nuong",    "Cá hồi nướng");
            fixFoodName(foods, "Sua tuoi it beo", "Sữa tươi ít béo");
            fixFoodName(foods, "Hat hanh nhan",   "Hạt hạnh nhân");

            // 4. Seed foods
            seedFood(foods, food("Phở bò",          buaChinhCat, "1 tô",       520, 28, 65, 16,
                "pho bo beef noodle soup", "Bổ sung carb và protein sau buổi chạy dài.",
                "https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&q=80"));
            seedFood(foods, food("Cơm tấm sườn",    buaChinhCat, "1 dĩa",      760, 34, 96, 24,
                "com tam suon rice pork", "Bữa trưa năng lượng cao cho ngày tập nặng.",
                "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80"));
            seedFood(foods, food("Bún bò Huế",      buaChinhCat, "1 tô",       610, 31, 78, 18,
                "bun bo hue beef noodle spicy soup", "Phù hợp sau buổi tập sức bền.",
                "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&q=80"));
            seedFood(foods, food("Bánh mì trứng",   buaChinhCat, "1 ổ",        430, 18, 58, 14,
                "banh mi trung sandwich egg baguette", "Bữa sáng tiện lợi, cân bằng protein và carb.",
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80"));
            seedFood(foods, food("Cơm gà xé",       buaChinhCat, "1 dĩa",      650, 38, 80, 18,
                "com ga xe chicken rice shredded", "Protein cao, lý tưởng cho bữa trưa sau tập.",
                "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80"));
            seedFood(foods, food("Trứng gà luộc",   proteinCat,  "1 quả",       70,  6,  1,  5,
                "trung ga egg boiled", "Nguồn protein đơn giản, dễ kết hợp với mọi bữa ăn.",
                "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80"));
            seedFood(foods, food("Whey protein",    proteinCat,  "1 scoop 30g", 120, 24,  3,  2,
                "whey protein scoop supplement", "Bổ sung protein nhanh sau buổi tập.",
                "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80"));
            seedFood(foods, food("Ức gà nướng",     proteinCat,  "100g",        165, 31,  0,  4,
                "uc ga chicken breast nuong grilled", "Protein nạc cao, hỗ trợ phục hồi cơ sau tập.",
                "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80"));
            seedFood(foods, food("Sữa chua Hy Lạp", proteinCat,  "170g",        150, 15, 12,  4,
                "sua chua hy lap greek yogurt", "Protein và probiotic, tốt cho tiêu hóa.",
                "https://images.unsplash.com/photo-1488477181899-9e8560fdd03c?w=400&q=80"));
            seedFood(foods, food("Cá hồi nướng",    proteinCat,  "150g",        280, 39,  0, 13,
                "ca hoi salmon nuong grilled fish", "Protein cao và omega-3 tốt cho cơ khớp.",
                "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80"));
            seedFood(foods, food("Đậu hũ xào",      proteinCat,  "150g",        180, 14, 10, 10,
                "dau hu tofu xao stir fried", "Protein thực vật, phù hợp cho ngày ăn nhẹ.",
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80"));
            seedFood(foods, food("Cơm trắng",        carbCat,     "100g",        130,  3, 28,  0,
                "com trang rice white cooked", "Nguồn carb cơ bản, dễ tiêu hóa.",
                "https://images.unsplash.com/photo-1536304447766-da0ed4ce1b73?w=400&q=80"));
            seedFood(foods, food("Chuối",            carbCat,     "1 trái",      105,  1, 27,  0,
                "chuoi banana trai", "Carb nhanh lý tưởng trước hoặc sau khi chạy.",
                "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80"));
            seedFood(foods, food("Yến mạch",         carbCat,     "50g khô",     190,  7, 32,  4,
                "yen mach oats oatmeal", "Carb chậm, duy trì năng lượng cho buổi sáng tập luyện.",
                "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&q=80"));
            seedFood(foods, food("Khoai lang",       carbCat,     "1 củ 150g",   130,  2, 30,  0,
                "khoai lang sweet potato", "Carb chỉ số GI thấp, năng lượng bền vững.",
                "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80"));
            seedFood(foods, food("Bánh mì đen",      carbCat,     "2 lát",       180,  8, 34,  3,
                "banh mi den whole wheat bread", "Carb giàu chất xơ, no lâu.",
                "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80"));
            seedFood(foods, food("Hạt hạnh nhân",    snackCat,    "30g",         170,  6,  6, 15,
                "hat hanh nhan almond nuts", "Chất béo lành mạnh và protein, ăn vặt lý tưởng.",
                "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80"));
            seedFood(foods, food("Thanh năng lượng", snackCat,    "1 thanh 40g", 180,  5, 28,  6,
                "thanh nang luong energy bar granola", "Bổ sung năng lượng nhanh giữa buổi tập.",
                "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80"));
            seedFood(foods, food("Sữa tươi ít béo",  drinkCat,    "200ml",        90,  7, 10,  2,
                "sua tuoi milk low fat", "Phục hồi sau bơi với protein và canxi.",
                "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80"));
            seedFood(foods, food("Nước dừa tươi",    drinkCat,    "330ml",        60,  1, 14,  0,
                "nuoc dua coconut water fresh", "Điện giải tự nhiên, bổ sung sau vận động.",
                "https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=400&q=80"));

            // 5. Nutrition plans — one per user, idempotent
            seedPlan(plans, 1L,  "Duy trì năng lượng cho 4 ngày chạy và 3 buổi bơi mỗi tuần.",       2500, 140, 350, 68, 3.0);
            seedPlan(plans, 2L,  "Hỗ trợ các buổi chạy nhịp cao và chạy nhẹ hàng ngày.",             2350, 125, 320, 65, 2.7);
            seedPlan(plans, 3L,  "Phục hồi sau khối lượng bơi lớn, giữ bữa ăn cân bằng.",            2300, 135, 285, 72, 3.1);
            seedPlan(plans, 4L,  "Kiểm soát cân nặng với protein đủ và calorie hợp lý.",              2100, 130, 245, 62, 2.5);
            seedPlan(plans, 5L,  "Xây dựng sức bền bơi lội và phục hồi hiệu quả.",                   2400, 135, 315, 70, 3.0);
            seedPlan(plans, 6L,  "Hỗ trợ tập marathon với carb cao và đủ sắt.",                       2700, 145, 390, 70, 3.2);
            seedPlan(plans, 7L,  "Nâng cao tốc độ bơi với protein sạch và carb cân đối.",             2200, 130, 270, 75, 3.3);
            seedPlan(plans, 8L,  "Chuẩn bị triathlon: macro cân bằng cho đa môn thể thao.",           2600, 145, 360, 72, 3.0);
            seedPlan(plans, 9L,  "Chạy địa hình siêu dài: thực phẩm dày calorie và giàu sắt.",        3100, 155, 430, 85, 3.5);
            seedPlan(plans, 10L, "Vận động viên phong trào: lượng ăn vừa phải, lối sống năng động.",  2200, 120, 290, 65, 2.8);

            // 6. Meal entries — per-user idempotent
            Set<Long> seededMealUsers = meals.findAll().stream()
                    .map(MealEntry::getUserId).collect(Collectors.toSet());

            if (!seededMealUsers.contains(1L))
                meals.saveAll(List.of(
                    meal(1L, "BREAKFAST", "Yến mạch + chuối + sữa chua",    null, 1.0, "1 bowl",    445, 23, 71,  8),
                    meal(1L, "LUNCH",     "Cơm trắng + ức gà nướng",         null, 1.0, "1 dĩa",    465, 37, 56,  8),
                    meal(1L, "DINNER",    "Phở bò",                           null, 1.0, "1 tô",     520, 28, 65, 16)
                ));
            if (!seededMealUsers.contains(2L))
                meals.saveAll(List.of(
                    meal(2L, "BREAKFAST", "Bánh mì đen + trứng luộc",        null, 1.0, "1 phần",   320, 18, 40,  9),
                    meal(2L, "LUNCH",     "Cơm tấm sườn",                     null, 1.0, "1 dĩa",   760, 34, 96, 24),
                    meal(2L, "SNACK",     "Hạt hạnh nhân + chuối",            null, 1.0, "1 phần",  275,  7, 33, 15)
                ));
            if (!seededMealUsers.contains(3L))
                meals.saveAll(List.of(
                    meal(3L, "BREAKFAST", "Yến mạch + sữa tươi",              null, 1.0, "1 bowl",   280, 14, 42,  6),
                    meal(3L, "LUNCH",     "Cá hồi nướng + cơm trắng",         null, 1.0, "1 dĩa",   410, 42, 28, 13),
                    meal(3L, "SNACK",     "Whey protein + chuối",              null, 1.0, "1 serving",225, 25, 30,  2)
                ));
            if (!seededMealUsers.contains(4L))
                meals.saveAll(List.of(
                    meal(4L, "BREAKFAST", "Sữa chua Hy Lạp + chuối",          null, 1.0, "1 bowl",   255, 16, 39,  4),
                    meal(4L, "LUNCH",     "Bún bò Huế",                        null, 1.0, "1 tô",    610, 31, 78, 18),
                    meal(4L, "DINNER",    "Đậu hũ xào + cơm trắng",            null, 1.0, "1 dĩa",   310, 17, 38, 10)
                ));
            if (!seededMealUsers.contains(5L))
                meals.saveAll(List.of(
                    meal(5L, "BREAKFAST", "Yến mạch + nước dừa",               null, 1.0, "1 bowl",   250,  8, 46,  4),
                    meal(5L, "LUNCH",     "Cơm gà xé",                          null, 1.0, "1 dĩa",   650, 38, 80, 18),
                    meal(5L, "SNACK",     "Sữa chua Hy Lạp",                    null, 1.0, "170g",    150, 15, 12,  4)
                ));
            if (!seededMealUsers.contains(6L))
                meals.saveAll(List.of(
                    meal(6L, "BREAKFAST", "Bánh mì trứng + chuối",              null, 1.0, "1 phần",  535, 19, 85, 14),
                    meal(6L, "LUNCH",     "Cơm tấm sườn + sữa tươi",            null, 1.0, "1 phần",  850, 41,106, 26),
                    meal(6L, "DINNER",    "Cá hồi nướng + khoai lang",           null, 1.0, "1 dĩa",   410, 41, 30, 13),
                    meal(6L, "SNACK",     "Thanh năng lượng",                    null, 1.0, "1 thanh", 180,  5, 28,  6)
                ));
            if (!seededMealUsers.contains(7L))
                meals.saveAll(List.of(
                    meal(7L, "BREAKFAST", "Yến mạch + sữa chua Hy Lạp",         null, 1.0, "1 bowl",   340, 22, 44,  8),
                    meal(7L, "LUNCH",     "Ức gà nướng + cơm trắng",             null, 1.0, "1 dĩa",   295, 34, 28,  4),
                    meal(7L, "SNACK",     "Whey protein",                         null, 1.0, "1 scoop", 120, 24,  3,  2)
                ));
            if (!seededMealUsers.contains(8L))
                meals.saveAll(List.of(
                    meal(8L, "BREAKFAST", "Bánh mì đen + trứng + chuối",         null, 1.0, "1 phần",  390, 19, 61,  8),
                    meal(8L, "LUNCH",     "Phở bò",                               null, 1.0, "1 tô",   520, 28, 65, 16),
                    meal(8L, "DINNER",    "Cá hồi + khoai lang",                  null, 1.0, "1 dĩa",  390, 42, 31, 13),
                    meal(8L, "SNACK",     "Nước dừa tươi + hạt hạnh nhân",        null, 1.0, "1 phần", 230,  7, 20, 15)
                ));
            if (!seededMealUsers.contains(9L))
                meals.saveAll(List.of(
                    meal(9L, "BREAKFAST", "Yến mạch + chuối + hạt hạnh nhân",    null, 1.0, "1 bowl",  465, 13, 65, 19),
                    meal(9L, "LUNCH",     "Cơm gà xé + khoai lang",               null, 1.0, "1 dĩa",  780, 40,110, 18),
                    meal(9L, "DINNER",    "Cá hồi nướng + cơm trắng",             null, 1.0, "1 dĩa",  410, 42, 28, 13),
                    meal(9L, "SNACK",     "Thanh năng lượng + nước dừa",           null, 1.0, "1 phần", 240,  6, 42,  6)
                ));
            if (!seededMealUsers.contains(10L))
                meals.saveAll(List.of(
                    meal(10L, "BREAKFAST", "Bánh mì trứng",                        null, 1.0, "1 ổ",   430, 18, 58, 14),
                    meal(10L, "LUNCH",     "Bún bò Huế",                           null, 1.0, "1 tô",  610, 31, 78, 18),
                    meal(10L, "SNACK",     "Sữa tươi ít béo + chuối",              null, 1.0, "1 phần",195,  8, 37,  2)
                ));
        };
    }

    private FoodCategory seedCategory(FoodCategoryRepository cats, String name, String desc, String icon) {
        return cats.findByNameIgnoreCase(name).orElseGet(() -> {
            FoodCategory cat = new FoodCategory();
            cat.setName(name); cat.setDescription(desc); cat.setIcon(icon);
            return cats.save(cat);
        });
    }

    private void fixFoodName(FoodRepository foods, String oldName, String newName) {
        if (oldName.equalsIgnoreCase(newName)) return;
        List<Food> matches = foods.findAllByOrderByNameAsc().stream()
                .filter(f -> f.getName().equalsIgnoreCase(oldName))
                .collect(Collectors.toList());
        if (matches.isEmpty()) return;
        boolean targetExists = foods.findAllByOrderByNameAsc().stream()
                .anyMatch(f -> f.getName().equalsIgnoreCase(newName));
        if (targetExists) {
            foods.deleteAll(matches);
        } else {
            Food first = matches.get(0);
            first.setName(newName);
            foods.save(first);
            if (matches.size() > 1) foods.deleteAll(matches.subList(1, matches.size()));
        }
    }

    private void seedFood(FoodRepository foods, Food food) {
        List<Food> matches = foods.findAllByOrderByNameAsc().stream()
                .filter(f -> f.getName().equalsIgnoreCase(food.getName()))
                .collect(Collectors.toList());
        if (matches.isEmpty()) {
            foods.save(food);
        } else {
            Food existing = matches.get(0);
            boolean updated = false;
            if (existing.getImageUrl() == null || existing.getImageUrl().isBlank()) {
                existing.setImageUrl(food.getImageUrl()); updated = true;
            }
            if (existing.getFoodCategory() == null && food.getFoodCategory() != null) {
                existing.setFoodCategory(food.getFoodCategory());
                existing.setCategory(food.getCategory()); updated = true;
            }
            if (updated) foods.save(existing);
            if (matches.size() > 1) foods.deleteAll(matches.subList(1, matches.size()));
        }
    }

    private Food food(String name, FoodCategory category, String servingSize,
                      int calories, int protein, int carbs, int fat,
                      String aliases, String note, String imageUrl) {
        Food food = new Food();
        food.setName(name);
        food.setFoodCategory(category);
        food.setCategory(category.getName());
        food.setServingSize(servingSize);
        food.setCalories(calories);
        food.setProteinGrams(protein);
        food.setCarbsGrams(carbs);
        food.setFatGrams(fat);
        food.setAliases(aliases);
        food.setNote(note);
        food.setImageUrl(imageUrl);
        food.setActive(true);
        return food;
    }

    private void seedPlan(NutritionPlanRepository plans, Long userId, String goal,
                          int calories, int protein, int carbs, int fat, double hydration) {
        if (plans.findByUserId(userId).isPresent()) return;
        NutritionPlan plan = new NutritionPlan();
        plan.setUserId(userId);
        plan.setGoal(goal);
        plan.setDailyCalories(calories);
        plan.setProteinGrams(protein);
        plan.setCarbsGrams(carbs);
        plan.setFatGrams(fat);
        plan.setHydrationLiters(hydration);
        plan.setGuidance("Ưu tiên carb gần buổi tập, bổ sung protein sau tập và uống đủ nước xuyên suốt cả ngày.");
        plans.save(plan);
    }

    private MealEntry meal(Long userId, String type, String name, Long foodId,
                           Double servings, String servingSize,
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
