package com.tuan.userservice.service;

import com.tuan.userservice.client.AuthServiceClient;
import com.tuan.userservice.client.NutritionServiceClient;
import com.tuan.userservice.client.WorkoutServiceClient;
import com.tuan.userservice.dto.CompleteOnboardingRequest;
import com.tuan.userservice.dto.MealPlanGenerateRequest;
import com.tuan.userservice.dto.NutritionProfileDTO;
import com.tuan.userservice.dto.OnboardingConfigPayload;
import com.tuan.userservice.dto.SeedWorkoutRequest;
import com.tuan.userservice.dto.UserDTO;
import com.tuan.userservice.dto.UserProfileDTO;
import com.tuan.userservice.entity.User;
import com.tuan.userservice.entity.UserProfile;
import com.tuan.userservice.repository.UserProfileRepository;
import com.tuan.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthServiceClient authServiceClient;
    private final NutritionServiceClient nutritionServiceClient;
    private final WorkoutServiceClient workoutServiceClient;

    public UserDTO getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::convertToDTO)
                .orElseGet(() -> authServiceClient.getUserById(id));
    }

    public java.util.List<UserDTO> getAllUsers() {
        return authServiceClient.getAllUsers();
    }

    public UserDTO updateUser(Long id, UserDTO userDTO) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(userDTO.getName());
        user.setAge(userDTO.getAge());
        user.setGender(userDTO.getGender());
        user.setHeight(userDTO.getHeight());
        user.setWeight(userDTO.getWeight());
        user.setFitnessGoal(userDTO.getFitnessGoal());

        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public UserProfileDTO getUserProfile(Long userId) {
        Optional<User> localUser = userRepository.findById(userId);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);

        if (profile == null) {
            UserProfileDTO fallback = new UserProfileDTO();
            fallback.setUserId(userId);

            if (localUser.isPresent()) {
                return applyLegacyProfileFallback(applyProfileFallbackFromUser(fallback, localUser.get()));
            }

            try {
                UserDTO authUser = authServiceClient.getUserById(userId);
                return applyLegacyProfileFallback(applyProfileFallbackFromAuthUser(fallback, authUser));
            } catch (Exception exception) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found");
            }
        }

        UserProfileDTO dto = convertProfileToDTO(profile);
        if (localUser.isPresent()) {
            dto = applyProfileFallbackFromUser(dto, localUser.get());
        }

        return applyLegacyProfileFallback(dto);
    }

    public UserProfileDTO createOrUpdateProfile(Long userId, UserProfileDTO profileDTO) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(new UserProfile());

        profile.setUserId(userId);
        profile.setBio(profileDTO.getBio());
        profile.setAvatarUrl(profileDTO.getAvatarUrl());
        profile.setAge(profileDTO.getAge());
        profile.setGender(profileDTO.getGender());
        profile.setHeight(profileDTO.getHeight());
        profile.setWeight(profileDTO.getWeight());
        profile.setOnboardingGoal(profileDTO.getOnboardingGoal());
        profile.setActivityLevel(profileDTO.getActivityLevel());
        profile.setSpecificGoal(profileDTO.getSpecificGoal());
        profile.setBmr(profileDTO.getBmr());
        profile.setActivityFactor(profileDTO.getActivityFactor());
        profile.setTdeeFormula(profileDTO.getTdeeFormula());
        profile.setTdee(profileDTO.getTdee());
        profile.setFitnessLevel(profileDTO.getFitnessLevel());
        profile.setPreferredWorkoutType(profileDTO.getPreferredWorkoutType());
        profile.setWeeklyGoal(profileDTO.getWeeklyGoal());
        profile.setTargetCalories(profileDTO.getTargetCalories());
        profile.setProteinTarget(profileDTO.getProteinTarget());
        profile.setCarbsTarget(profileDTO.getCarbsTarget());
        profile.setFatTarget(profileDTO.getFatTarget());
        profile.setMealsPerDay(profileDTO.getMealsPerDay());
        profile.setPreferences(Optional.ofNullable(profileDTO.getPreferences()).orElse(Set.of()));
        profile.setAllergies(Optional.ofNullable(profileDTO.getAllergies()).orElse(Set.of()));

        UserProfile savedProfile = userProfileRepository.save(profile);
        return convertProfileToDTO(savedProfile);
    }

    public NutritionProfileDTO getNutritionProfile(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found"));

        OnboardingConfigPayload onboardingConfig = getOnboardingConfigSnapshot();

        Optional<User> userOptional = userRepository.findById(userId);
        int tdee = Optional.ofNullable(profile.getTdee())
            .orElseGet(() -> userOptional.map(user -> calculateTdee(user, onboardingConfig)).orElse(2000));

        String normalizedGoal = normalizeGoal(profile.getOnboardingGoal(), onboardingConfig);
        int targetCalories = Optional.ofNullable(profile.getTargetCalories())
            .orElse(adjustCaloriesByGoal(tdee, normalizedGoal, onboardingConfig));

        MacroTargets macroTargets = calculateMacroTargets(targetCalories, onboardingConfig);
        int defaultMealsPerDay = resolveDefaultMealsPerDay(onboardingConfig);

        NutritionProfileDTO nutrition = new NutritionProfileDTO();
        nutrition.setUserId(userId);
        nutrition.setTargetCalories(targetCalories);
        nutrition.setProteinTarget(Optional.ofNullable(profile.getProteinTarget()).orElse(macroTargets.protein()));
        nutrition.setCarbsTarget(Optional.ofNullable(profile.getCarbsTarget()).orElse(macroTargets.carbs()));
        nutrition.setFatTarget(Optional.ofNullable(profile.getFatTarget()).orElse(macroTargets.fat()));
        nutrition.setMealsPerDay(Optional.ofNullable(profile.getMealsPerDay()).orElse(defaultMealsPerDay));
        nutrition.setPreferences(Optional.ofNullable(profile.getPreferences()).orElse(Set.of()));
        nutrition.setAllergies(Optional.ofNullable(profile.getAllergies()).orElse(Set.of()));

        return nutrition;
    }

    public UserProfileDTO completeOnboarding(Long userId, CompleteOnboardingRequest request) {
        OnboardingConfigPayload onboardingConfig = getOnboardingConfigSnapshot();
        CompleteOnboardingRequest normalized = normalizeOnboardingRequest(request, onboardingConfig);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(new UserProfile());

        String normalizedGoal = normalizeGoal(normalized.getGoal(), onboardingConfig);
        String normalizedActivityLevel = normalizeActivityLevel(normalized.getActivityLevel(), onboardingConfig);
        double bmrValue = calculateBmr(
            normalized.getGender(),
            normalized.getAge(),
            normalized.getHeightCm(),
            normalized.getWeightKg()
        );
        double activityFactor = resolveActivityFactor(normalizedActivityLevel, onboardingConfig);
        int tdee = calculateTdee(bmrValue, activityFactor);
        int targetCalories = adjustCaloriesByGoal(tdee, normalizedGoal, onboardingConfig);
        MacroTargets macroTargets = calculateMacroTargets(targetCalories, onboardingConfig);
        int defaultMealsPerDay = resolveDefaultMealsPerDay(onboardingConfig);

        profile.setUserId(userId);
        profile.setAge(normalized.getAge());
        profile.setGender(normalized.getGender());
        profile.setHeight(normalized.getHeightCm());
        profile.setWeight(normalized.getWeightKg());
        profile.setOnboardingGoal(normalizedGoal);
        profile.setActivityLevel(normalizedActivityLevel);
        profile.setSpecificGoal(normalized.getSpecificGoal());
        profile.setBmr((int) Math.round(bmrValue));
        profile.setActivityFactor(activityFactor);
        profile.setTdeeFormula("Mifflin-St Jeor");
        profile.setTdee(tdee);
        profile.setFitnessLevel(normalizedActivityLevel);
        profile.setPreferredWorkoutType(normalized.getSpecificGoal());
        profile.setWeeklyGoal(resolveWeeklyGoal(normalizedActivityLevel, normalized.getTrainingDaysPerWeek()));
        profile.setTargetCalories(targetCalories);
        profile.setProteinTarget(macroTargets.protein());
        profile.setCarbsTarget(macroTargets.carbs());
        profile.setFatTarget(macroTargets.fat());
        profile.setMealsPerDay(defaultMealsPerDay);
        profile.setPreferences(Optional.ofNullable(normalized.getPreferences()).orElse(Set.of()));
        profile.setAllergies(Optional.ofNullable(normalized.getAllergies()).orElse(Set.of()));
        profile.setBio(buildOnboardingSnapshot(normalized, bmrValue, activityFactor, tdee, targetCalories, macroTargets));

        UserProfile savedProfile = userProfileRepository.save(profile);
        updateExistingUserMetrics(userId, normalized, normalizedGoal);
        triggerPersonalizedPlans(userId, normalized, targetCalories, macroTargets, defaultMealsPerDay);

        return convertProfileToDTO(savedProfile);
    }

    private void updateExistingUserMetrics(Long userId, CompleteOnboardingRequest request, String normalizedGoal) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setAge(request.getAge());
            user.setGender(request.getGender());
            user.setHeight(request.getHeightCm());
            user.setWeight(request.getWeightKg());
            user.setFitnessGoal(normalizedGoal);
            userRepository.save(user);
        });
    }

    private void triggerPersonalizedPlans(
            Long userId,
            CompleteOnboardingRequest request,
            Integer targetCalories,
            MacroTargets macroTargets,
            Integer mealsPerDay
    ) {
        MealPlanGenerateRequest mealRequest = new MealPlanGenerateRequest();
        mealRequest.setUserId(userId);
        mealRequest.setStartDate(LocalDate.now());
        mealRequest.setMealsPerDay(mealsPerDay);
        mealRequest.setTargetCalories(targetCalories);
        mealRequest.setProteinTarget(macroTargets.protein());
        mealRequest.setCarbsTarget(macroTargets.carbs());
        mealRequest.setFatTarget(macroTargets.fat());
        mealRequest.setPreferences(Optional.ofNullable(request.getPreferences()).orElse(Set.of()));
        mealRequest.setAllergies(Optional.ofNullable(request.getAllergies()).orElse(Set.of()));
        nutritionServiceClient.generateMealPlan(mealRequest);

        SeedWorkoutRequest workoutRequest = new SeedWorkoutRequest();
        workoutRequest.setUserId(userId);
        workoutRequest.setGender(request.getGender());
        workoutRequest.setAge(request.getAge());
        workoutRequest.setHeightCm(request.getHeightCm());
        workoutRequest.setWeightKg(request.getWeightKg());
        workoutRequest.setGoal(toWorkoutGoalLabel(normalizeGoal(request.getGoal())));
        workoutRequest.setTrainingLevel(resolveTrainingLevel(request.getActivityLevel(), request.getTrainingDaysPerWeek()));
        workoutRequest.setTrainingDaysPerWeek(request.getTrainingDaysPerWeek());
        workoutRequest.setPreferences(Optional.ofNullable(request.getPreferences()).orElse(Set.of()).stream().toList());
        workoutServiceClient.generateSampleWorkoutPlan(workoutRequest);
    }

    private CompleteOnboardingRequest normalizeOnboardingRequest(CompleteOnboardingRequest request, OnboardingConfigPayload config) {
        CompleteOnboardingRequest normalized = new CompleteOnboardingRequest();

        ValidationBounds bounds = resolveValidationBounds(config);
        String defaultGoal = resolveDefaultGoal(config);
        String defaultActivityLevel = resolveDefaultActivityLevel(config);

        normalized.setGender(normalizeGender(request == null ? null : request.getGender()));
        normalized.setAge(safeAge(request == null ? null : request.getAge(), bounds));
        normalized.setHeightCm(safeHeight(request == null ? null : request.getHeightCm(), bounds));
        normalized.setWeightKg(safeWeight(request == null ? null : request.getWeightKg(), bounds));

        String goal = request == null ? defaultGoal : request.getGoal();
        normalized.setGoal(normalizeGoal(goal, config));

        String activityLevel = request == null ? defaultActivityLevel : request.getActivityLevel();
        normalized.setActivityLevel(normalizeActivityLevel(activityLevel, config));
        normalized.setTrainingDaysPerWeek(safeTrainingDaysPerWeek(request == null ? null : request.getTrainingDaysPerWeek()));

        String specificGoal = sanitizeText(request == null ? null : request.getSpecificGoal(), "Cai thien suc khoe tong the");
        normalized.setSpecificGoal(specificGoal);

        normalized.setPreferences(Optional.ofNullable(request == null ? null : request.getPreferences()).orElse(Set.of()));
        normalized.setAllergies(Optional.ofNullable(request == null ? null : request.getAllergies()).orElse(Set.of()));
        normalized.setDietPreference(sanitizeText(request == null ? null : request.getDietPreference(), "no-limit"));

        return normalized;
    }

    private Integer safeAge(Integer value, ValidationBounds bounds) {
        int fallback = clampInt(25, bounds.minAge(), bounds.maxAge());
        if (value == null) {
            return fallback;
        }
        if (value < bounds.minAge() || value > bounds.maxAge()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format(
                    Locale.ROOT,
                    "Age must be between %d and %d",
                    bounds.minAge(),
                    bounds.maxAge()
            ));
        }
        return value;
    }

    private Double safeHeight(Double value, ValidationBounds bounds) {
        double fallback = clampDouble(170.0d, bounds.minHeightCm(), bounds.maxHeightCm());
        if (value == null) {
            return fallback;
        }
        if (value < bounds.minHeightCm() || value > bounds.maxHeightCm()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format(
                    Locale.ROOT,
                    "Height must be between %.1f and %.1f cm",
                    bounds.minHeightCm(),
                    bounds.maxHeightCm()
            ));
        }
        return value;
    }

    private Double safeWeight(Double value, ValidationBounds bounds) {
        double fallback = clampDouble(70.0d, bounds.minWeightKg(), bounds.maxWeightKg());
        if (value == null) {
            return fallback;
        }
        if (value < bounds.minWeightKg() || value > bounds.maxWeightKg()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.format(
                    Locale.ROOT,
                    "Weight must be between %.1f and %.1f kg",
                    bounds.minWeightKg(),
                    bounds.maxWeightKg()
            ));
        }
        return value;
    }

    private String normalizeGender(String value) {
        String text = sanitizeText(value, "male").toLowerCase(Locale.ROOT);
        if (text.contains("nu") || text.contains("female")) {
            return "female";
        }
        if (text.contains("nam") || text.contains("male")) {
            return "male";
        }
        return "other";
    }

    private String normalizeGoal(String value) {
        String text = sanitizeText(value, "maintain").toLowerCase(Locale.ROOT);
        if (text.contains("giam") || text.contains("lose") || text.contains("fat") || text.contains("can")) {
            return "lose";
        }
        if (text.contains("tang") || text.contains("build") || text.contains("muscle") || text.contains("gain")) {
            return "gain";
        }
        if (text.contains("duy") || text.contains("maintain")) {
            return "maintain";
        }
        return "maintain";
    }

    private String normalizeGoal(String value, OnboardingConfigPayload config) {
        String candidate = normalizeGoal(value);
        if (hasGoalConfig(config, candidate)) {
            return candidate;
        }

        String defaultGoal = resolveDefaultGoal(config);
        if (hasGoalConfig(config, defaultGoal)) {
            return defaultGoal;
        }

        return candidate;
    }

    private String normalizeActivityLevel(String value, OnboardingConfigPayload config) {
        String fallback = resolveDefaultActivityLevel(config);
        String normalized = sanitizeText(value, fallback).toLowerCase(Locale.ROOT);

        String candidate;
        if (normalized.contains("very_active") || normalized.contains("very") || normalized.contains("athlete") || normalized.contains("lao dong nang")) {
            candidate = "very_active";
        } else if (normalized.contains("active") || normalized.contains("intense") || normalized.contains("6-7") || normalized.contains("cao")) {
            candidate = "active";
        } else if (normalized.contains("light") || normalized.contains("1-2") || normalized.contains("nhe")) {
            candidate = "light";
        } else if (normalized.contains("sedentary") || normalized.contains("beginner") || normalized.contains("new") || normalized.contains("it van dong") || normalized.contains("thap")) {
            candidate = "sedentary";
        } else {
            candidate = "moderate";
        }

        if (hasActivityConfig(config, candidate)) {
            return candidate;
        }

        if (hasActivityConfig(config, fallback)) {
            return fallback;
        }

        return candidate;
    }

    private String sanitizeText(String value, String fallback) {
        String text = value == null ? "" : value.trim();
        return text.isEmpty() ? fallback : text;
    }

    private Integer safeTrainingDaysPerWeek(Integer value) {
        if (value == null) {
            return 3;
        }
        return clampInt(value, 2, 7);
    }

    private int resolveWeeklyGoal(String activityLevel, Integer trainingDaysPerWeek) {
        if (trainingDaysPerWeek != null) {
            return clampInt(trainingDaysPerWeek, 2, 7);
        }

        return switch (normalizeActivityKey(activityLevel)) {
            case "sedentary" -> 2;
            case "light" -> 3;
            case "active" -> 5;
            case "very_active" -> 6;
            default -> 4;
        };
    }

    private String resolveTrainingLevel(String activityLevel, Integer trainingDaysPerWeek) {
        if (trainingDaysPerWeek != null) {
            int days = clampInt(trainingDaysPerWeek, 2, 7);
            if (days <= 2) {
                return "1-2 buổi/tuần";
            }
            if (days <= 4) {
                return "3-4 buổi/tuần";
            }
            return "5+ buổi/tuần";
        }

        return switch (normalizeActivityKey(activityLevel)) {
            case "sedentary" -> "Người mới";
            case "light" -> "1-2 buổi/tuần";
            case "active" -> "4-5 buổi/tuần";
            case "very_active" -> "5+ buổi/tuần";
            default -> "3-4 buổi/tuần";
        };
    }

    private String toWorkoutGoalLabel(String goal) {
        return switch (goal) {
            case "lose" -> "Giảm cân";
            case "gain", "build" -> "Tăng cơ";
            default -> "Duy trì";
        };
    }

    private double calculateBmr(String gender, Integer age, Double height, Double weight) {
        double bmr;
        if ("female".equalsIgnoreCase(gender)) {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        } else if ("male".equalsIgnoreCase(gender)) {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age;
        }

        return bmr;
    }

    private int calculateTdee(double bmr, double activityFactor) {
        return (int) Math.round(bmr * activityFactor);
    }

    private int calculateTdee(User user, OnboardingConfigPayload config) {
        if (user.getAge() == null || user.getHeight() == null || user.getWeight() == null) {
            return 2000;
        }
        double bmr = calculateBmr(user.getGender(), user.getAge(), user.getHeight(), user.getWeight());
        return calculateTdee(bmr, resolveActivityFactor(resolveDefaultActivityLevel(config), config));
    }

    private double resolveActivityFactor(String activityLevel, OnboardingConfigPayload config) {
        String normalized = normalizeActivityLevel(activityLevel, config);

        if (config != null && config.getActivityConfigs() != null) {
            Optional<Double> factor = config.getActivityConfigs().stream()
                    .filter(item -> normalizeActivityKey(item.getActivityLevel()).equals(normalized))
                    .map(OnboardingConfigPayload.ActivityConfigItem::getActivityFactor)
                    .filter(value -> value != null && value > 0)
                    .findFirst();

            if (factor.isPresent()) {
                return factor.get();
            }
        }

        return switch (normalized) {
            case "sedentary" -> 1.2d;
            case "light" -> 1.375d;
            case "active" -> 1.725d;
            case "very_active" -> 1.9d;
            default -> 1.55d;
        };
    }

    private int adjustCaloriesByGoal(int tdee, String goal, OnboardingConfigPayload config) {
        String normalizedGoal = normalizeGoal(goal, config);
        double adjustmentPercent = resolveGoalAdjustmentPercent(config, normalizedGoal);

        if ("lose".equals(normalizedGoal)) {
            return Math.max(1200, (int) Math.round(tdee * (1.0d - adjustmentPercent)));
        }

        if ("gain".equals(normalizedGoal)) {
            return Math.max(1200, (int) Math.round(tdee * (1.0d + adjustmentPercent)));
        }

        return Math.max(1200, tdee);
    }

    private MacroTargets calculateMacroTargets(int calories, OnboardingConfigPayload config) {
        MacroRatioConfig ratioConfig = resolveMacroRatioConfig(config);
        return new MacroTargets(
                Math.max(0, Math.round((float) ((calories * ratioConfig.proteinRatio()) / 4.0d))),
                Math.max(0, Math.round((float) ((calories * ratioConfig.carbsRatio()) / 4.0d))),
                Math.max(0, Math.round((float) ((calories * ratioConfig.fatRatio()) / 9.0d)))
        );
    }

    private OnboardingConfigPayload getOnboardingConfigSnapshot() {
        try {
            OnboardingConfigPayload config = authServiceClient.getOnboardingConfig();
            if (config == null) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Onboarding config is unavailable");
            }
            return config;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Cannot fetch onboarding config");
        }
    }

    private double resolveGoalAdjustmentPercent(OnboardingConfigPayload config, String goalType) {
        if (config != null && config.getGoalConfigs() != null) {
            Optional<Double> percent = config.getGoalConfigs().stream()
                    .filter(item -> normalizeToken(item.getGoalType()).equals(normalizeToken(goalType)))
                    .map(OnboardingConfigPayload.GoalConfigItem::getValue)
                    .filter(value -> value != null && value >= 0)
                    .findFirst();

            if (percent.isPresent()) {
                return Math.min(1.0d, Math.abs(percent.get()));
            }
        }

        if ("lose".equals(normalizeToken(goalType))) {
            return 0.15d;
        }
        if ("gain".equals(normalizeToken(goalType))) {
            return 0.10d;
        }
        return 0.0d;
    }

    private MacroRatioConfig resolveMacroRatioConfig(OnboardingConfigPayload config) {
        double protein = 0.30d;
        double carbs = 0.40d;
        double fat = 0.30d;

        if (config != null && config.getMacroConfig() != null) {
            if (config.getMacroConfig().getProteinRatio() != null) {
                protein = config.getMacroConfig().getProteinRatio();
            }
            if (config.getMacroConfig().getCarbsRatio() != null) {
                carbs = config.getMacroConfig().getCarbsRatio();
            }
            if (config.getMacroConfig().getFatRatio() != null) {
                fat = config.getMacroConfig().getFatRatio();
            }
        }

        double total = protein + carbs + fat;
        if (Math.abs(total - 1.0d) >= 0.001d || total <= 0) {
            return new MacroRatioConfig(0.30d, 0.40d, 0.30d);
        }

        return new MacroRatioConfig(protein, carbs, fat);
    }

    private ValidationBounds resolveValidationBounds(OnboardingConfigPayload config) {
        int minAge = 13;
        int maxAge = 80;
        double minHeight = 120.0d;
        double maxHeight = 230.0d;
        double minWeight = 35.0d;
        double maxWeight = 250.0d;

        if (config != null && config.getValidationConfig() != null) {
            if (config.getValidationConfig().getMinAge() != null) {
                minAge = config.getValidationConfig().getMinAge();
            }
            if (config.getValidationConfig().getMaxAge() != null) {
                maxAge = config.getValidationConfig().getMaxAge();
            }
            if (config.getValidationConfig().getMinHeightCm() != null) {
                minHeight = config.getValidationConfig().getMinHeightCm();
            }
            if (config.getValidationConfig().getMaxHeightCm() != null) {
                maxHeight = config.getValidationConfig().getMaxHeightCm();
            }
            if (config.getValidationConfig().getMinWeightKg() != null) {
                minWeight = config.getValidationConfig().getMinWeightKg();
            }
            if (config.getValidationConfig().getMaxWeightKg() != null) {
                maxWeight = config.getValidationConfig().getMaxWeightKg();
            }
        }

        int safeMinAge = Math.max(1, Math.min(minAge, maxAge));
        int safeMaxAge = Math.max(safeMinAge, maxAge);
        double safeMinHeight = Math.max(1.0d, Math.min(minHeight, maxHeight));
        double safeMaxHeight = Math.max(safeMinHeight, maxHeight);
        double safeMinWeight = Math.max(1.0d, Math.min(minWeight, maxWeight));
        double safeMaxWeight = Math.max(safeMinWeight, maxWeight);

        return new ValidationBounds(safeMinAge, safeMaxAge, safeMinHeight, safeMaxHeight, safeMinWeight, safeMaxWeight);
    }

    private String resolveDefaultGoal(OnboardingConfigPayload config) {
        String configured = normalizeGoal(config != null && config.getDefaultConfig() != null
                ? config.getDefaultConfig().getDefaultGoal()
                : null);
        if (hasGoalConfig(config, configured)) {
            return configured;
        }

        if (config != null && config.getGoalConfigs() != null && !config.getGoalConfigs().isEmpty()) {
            return normalizeGoal(config.getGoalConfigs().get(0).getGoalType());
        }

        return "maintain";
    }

    private String resolveDefaultActivityLevel(OnboardingConfigPayload config) {
        String configured = normalizeActivityKey(config != null && config.getDefaultConfig() != null
                ? config.getDefaultConfig().getDefaultActivityLevel()
                : null);
        if (hasActivityConfig(config, configured)) {
            return configured;
        }

        if (config != null && config.getActivityConfigs() != null && !config.getActivityConfigs().isEmpty()) {
            return normalizeActivityKey(config.getActivityConfigs().get(0).getActivityLevel());
        }

        return "moderate";
    }

    private int resolveDefaultMealsPerDay(OnboardingConfigPayload config) {
        Integer configured = config != null && config.getDefaultConfig() != null
                ? config.getDefaultConfig().getDefaultMealsPerDay()
                : null;

        if (configured == null) {
            return 3;
        }

        return Math.max(1, Math.min(10, configured));
    }

    private boolean hasGoalConfig(OnboardingConfigPayload config, String goalType) {
        if (config == null || config.getGoalConfigs() == null) {
            return false;
        }

        String normalized = normalizeToken(goalType);
        return config.getGoalConfigs().stream()
                .map(OnboardingConfigPayload.GoalConfigItem::getGoalType)
                .map(this::normalizeToken)
                .anyMatch(normalized::equals);
    }

    private boolean hasActivityConfig(OnboardingConfigPayload config, String activityLevel) {
        if (config == null || config.getActivityConfigs() == null) {
            return false;
        }

        String normalized = normalizeActivityKey(activityLevel);
        return config.getActivityConfigs().stream()
                .map(OnboardingConfigPayload.ActivityConfigItem::getActivityLevel)
                .map(this::normalizeActivityKey)
                .anyMatch(normalized::equals);
    }

    private String normalizeActivityKey(String value) {
        String normalized = normalizeToken(value);
        if (normalized.contains("very_active") || normalized.contains("very") || normalized.contains("athlete")) {
            return "very_active";
        }
        if (normalized.contains("active") || normalized.contains("intense") || normalized.contains("6-7") || normalized.contains("cao")) {
            return "active";
        }
        if (normalized.contains("light") || normalized.contains("1-2") || normalized.contains("nhe")) {
            return "light";
        }
        if (normalized.contains("sedentary") || normalized.contains("beginner") || normalized.contains("new") || normalized.contains("thap") || normalized.contains("it")) {
            return "sedentary";
        }
        return "moderate";
    }

    private String normalizeToken(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private int clampInt(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private double clampDouble(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private String buildOnboardingSnapshot(
            CompleteOnboardingRequest request,
            Double bmr,
            Double activityFactor,
            Integer tdee,
            Integer targetCalories,
            MacroTargets macroTargets
    ) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("gender", request.getGender());
        snapshot.put("age", request.getAge());
        snapshot.put("height", request.getHeightCm());
        snapshot.put("weight", request.getWeightKg());
        snapshot.put("goal", request.getGoal());
        snapshot.put("activityLevel", request.getActivityLevel());
        snapshot.put("trainingDaysPerWeek", request.getTrainingDaysPerWeek());
        snapshot.put("specificGoal", request.getSpecificGoal());
        snapshot.put("dietPreference", request.getDietPreference());
        snapshot.put("tdeeFormula", "Mifflin-St Jeor");
        snapshot.put("bmr", Math.round(bmr));
        snapshot.put("activityFactor", activityFactor);
        snapshot.put("tdee", tdee);
        snapshot.put("targetCalories", targetCalories);
        snapshot.put("protein", macroTargets.protein());
        snapshot.put("carbs", macroTargets.carbs());
        snapshot.put("fat", macroTargets.fat());

        return snapshot.toString();
    }

    private UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setAge(user.getAge());
        dto.setGender(user.getGender());
        dto.setHeight(user.getHeight());
        dto.setWeight(user.getWeight());
        dto.setFitnessGoal(user.getFitnessGoal());
        return dto;
    }

    private UserProfileDTO convertProfileToDTO(UserProfile profile) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUserId());
        dto.setBio(profile.getBio());
        dto.setAvatarUrl(profile.getAvatarUrl());
        dto.setAge(profile.getAge());
        dto.setGender(profile.getGender());
        dto.setHeight(profile.getHeight());
        dto.setWeight(profile.getWeight());
        dto.setOnboardingGoal(profile.getOnboardingGoal());
        dto.setActivityLevel(profile.getActivityLevel());
        dto.setSpecificGoal(profile.getSpecificGoal());
        dto.setBmr(profile.getBmr());
        dto.setActivityFactor(profile.getActivityFactor());
        dto.setTdeeFormula(profile.getTdeeFormula());
        dto.setTdee(profile.getTdee());
        dto.setFitnessLevel(profile.getFitnessLevel());
        dto.setPreferredWorkoutType(profile.getPreferredWorkoutType());
        dto.setWeeklyGoal(profile.getWeeklyGoal());
        dto.setTargetCalories(profile.getTargetCalories());
        dto.setProteinTarget(profile.getProteinTarget());
        dto.setCarbsTarget(profile.getCarbsTarget());
        dto.setFatTarget(profile.getFatTarget());
        dto.setMealsPerDay(profile.getMealsPerDay());
        dto.setPreferences(profile.getPreferences());
        dto.setAllergies(profile.getAllergies());
        return dto;
    }

    private UserProfileDTO applyLegacyProfileFallback(UserProfileDTO dto) {
        if (dto == null) {
            return null;
        }

        if (isBlank(dto.getActivityLevel()) && !isBlank(dto.getFitnessLevel())) {
            dto.setActivityLevel(dto.getFitnessLevel());
        }

        if (isBlank(dto.getSpecificGoal()) && !isBlank(dto.getPreferredWorkoutType())) {
            dto.setSpecificGoal(dto.getPreferredWorkoutType());
        }

        return dto;
    }

    private UserProfileDTO applyProfileFallbackFromUser(UserProfileDTO dto, User user) {
        if (dto == null || user == null) {
            return dto;
        }

        if (dto.getAge() == null) {
            dto.setAge(user.getAge());
        }
        if (isBlank(dto.getGender())) {
            dto.setGender(user.getGender());
        }
        if (dto.getHeight() == null) {
            dto.setHeight(user.getHeight());
        }
        if (dto.getWeight() == null) {
            dto.setWeight(user.getWeight());
        }

        if (isBlank(dto.getOnboardingGoal()) && !isBlank(user.getFitnessGoal())) {
            dto.setOnboardingGoal(normalizeGoal(user.getFitnessGoal()));
        }

        if (isBlank(dto.getSpecificGoal()) && !isBlank(user.getFitnessGoal())) {
            dto.setSpecificGoal(user.getFitnessGoal());
        }

        return dto;
    }

    private UserProfileDTO applyProfileFallbackFromAuthUser(UserProfileDTO dto, UserDTO user) {
        if (dto == null || user == null) {
            return dto;
        }

        if (dto.getAge() == null) {
            dto.setAge(user.getAge());
        }
        if (isBlank(dto.getGender())) {
            dto.setGender(user.getGender());
        }
        if (dto.getHeight() == null) {
            dto.setHeight(user.getHeight());
        }
        if (dto.getWeight() == null) {
            dto.setWeight(user.getWeight());
        }

        if (isBlank(dto.getOnboardingGoal()) && !isBlank(user.getFitnessGoal())) {
            dto.setOnboardingGoal(normalizeGoal(user.getFitnessGoal()));
        }

        if (isBlank(dto.getSpecificGoal()) && !isBlank(user.getFitnessGoal())) {
            dto.setSpecificGoal(user.getFitnessGoal());
        }

        return dto;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private record MacroTargets(int protein, int carbs, int fat) {}

    private record MacroRatioConfig(double proteinRatio, double carbsRatio, double fatRatio) {}

    private record ValidationBounds(
            int minAge,
            int maxAge,
            double minHeightCm,
            double maxHeightCm,
            double minWeightKg,
            double maxWeightKg
    ) {}
}
