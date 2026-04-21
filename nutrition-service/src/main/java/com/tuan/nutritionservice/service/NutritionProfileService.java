package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.client.UserServiceClient;
import com.tuan.nutritionservice.dto.request.GenerateMealPlanRequest;
import com.tuan.nutritionservice.dto.request.UpsertNutritionProfileRequest;
import com.tuan.nutritionservice.dto.response.UserSnapshotDto;
import com.tuan.nutritionservice.dto.response.UserNutritionProfileDto;
import com.tuan.nutritionservice.entity.UserNutritionProfile;
import com.tuan.nutritionservice.exception.NutritionException;
import com.tuan.nutritionservice.repository.UserNutritionProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NutritionProfileService {

    private final UserNutritionProfileRepository userNutritionProfileRepository;
    private final UserServiceClient userServiceClient;

    @Transactional(readOnly = true)
    public UserNutritionProfileDto getByUserId(Long userId) {
        UserNutritionProfile profile = userNutritionProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NutritionException("Chưa có hồ sơ dinh dưỡng cho user #" + userId));
        return toDto(profile);
    }

    @Transactional
    public UserNutritionProfileDto upsert(Long userId, UpsertNutritionProfileRequest request) {
        UserNutritionProfile profile = userNutritionProfileRepository.findByUserId(userId)
                .orElseGet(() -> UserNutritionProfile.builder().userId(userId).build());

        mergeFromUpsertRequest(profile, request);
        enrichFromUserServiceSnapshot(profile, userId);
        recomputeDerivedNutrition(profile, userId);
        UserNutritionProfile saved = userNutritionProfileRepository.save(profile);
        return toDto(saved);
    }

    @Transactional
    public UserNutritionProfileDto resolveForMealPlan(GenerateMealPlanRequest request) {
        Long userId = request.getUserId();
        UserNutritionProfile profile = userNutritionProfileRepository.findByUserId(userId)
                .orElseGet(() -> UserNutritionProfile.builder().userId(userId).build());

        mergeFromGenerateRequest(profile, request);
        enrichFromUserServiceSnapshot(profile, userId);
        recomputeDerivedNutrition(profile, userId);

        UserNutritionProfile saved = userNutritionProfileRepository.save(profile);
        return toDto(saved);
    }

    private void mergeFromUpsertRequest(UserNutritionProfile profile, UpsertNutritionProfileRequest request) {
        applyIfPresent(request.getHeightCm(), profile::setHeightCm);
        applyIfPresent(request.getWeightKg(), profile::setWeightKg);
        applyIfHasText(request.getActivityLevel(), profile::setActivityLevel);
        applyIfHasText(request.getGoal(), profile::setGoal);
        applyIfPresent(request.getMealsPerDay(), profile::setMealsPerDay);

        if (request.getPreferences() != null) {
            profile.setPreferences(normalizeSet(request.getPreferences()));
        }
        if (request.getAllergies() != null) {
            profile.setAllergies(normalizeSet(request.getAllergies()));
        }
    }

    private void mergeFromGenerateRequest(UserNutritionProfile profile, GenerateMealPlanRequest request) {
        applyIfPresent(request.getHeightCm(), profile::setHeightCm);
        applyIfPresent(request.getWeightKg(), profile::setWeightKg);
        applyIfHasText(request.getActivityLevel(), profile::setActivityLevel);
        applyIfHasText(request.getGoal(), profile::setGoal);
        applyIfPresent(request.getMealsPerDay(), profile::setMealsPerDay);

        if (request.getPreferences() != null) {
            profile.setPreferences(normalizeSet(request.getPreferences()));
        }
        if (request.getAllergies() != null) {
            profile.setAllergies(normalizeSet(request.getAllergies()));
        }
    }

    private void enrichFromUserServiceSnapshot(UserNutritionProfile profile, Long userId) {
        try {
            UserSnapshotDto snapshot = userServiceClient.getUserById(userId);
            if (snapshot != null) {
                if (snapshot.getAge() != null && snapshot.getAge() > 0) {
                    profile.setAge(snapshot.getAge());
                }
                applyIfHasText(snapshot.getGender(), profile::setGender);

                if (profile.getHeightCm() == null && snapshot.getHeight() != null && snapshot.getHeight() > 0) {
                    profile.setHeightCm((int) Math.round(snapshot.getHeight()));
                }
                if (profile.getWeightKg() == null && snapshot.getWeight() != null && snapshot.getWeight() > 0) {
                    profile.setWeightKg((int) Math.round(snapshot.getWeight()));
                }
            }
        } catch (Exception exception) {
            if (profile.getAge() == null || profile.getGender() == null || profile.getGender().isBlank()) {
                throw new NutritionException("Không thể đồng bộ age/gender từ user-service cho user #" + userId);
            }
        }
    }

    private void recomputeDerivedNutrition(UserNutritionProfile profile, Long userId) {
        if (profile.getHeightCm() == null || profile.getWeightKg() == null || profile.getAge() == null
                || profile.getGender() == null || profile.getGender().isBlank()) {
            throw new NutritionException("Thiếu age/gender/height/weight để tính dinh dưỡng cho user #" + userId);
        }

        String normalizedGoal = normalizeGoal(profile.getGoal());
        String normalizedActivity = Optional.ofNullable(profile.getActivityLevel()).orElse("moderate").trim();

        int bmr = calculateBmr(profile.getGender(), profile.getAge(), profile.getHeightCm(), profile.getWeightKg());
        double activityFactor = resolveActivityFactor(normalizedActivity);
        int tdee = (int) Math.round(bmr * activityFactor);
        int targetCalories = adjustCaloriesByGoal(tdee, normalizedGoal);

        MacroTargets macroTargets = calculateMacroTargets(targetCalories, normalizedGoal);

        profile.setGoal(normalizedGoal);
        profile.setActivityLevel(normalizedActivity);
        profile.setBmr(bmr);
        profile.setTdee(tdee);
        profile.setTargetCalories(targetCalories);
        profile.setProteinTarget(macroTargets.protein());
        profile.setCarbsTarget(macroTargets.carbs());
        profile.setFatTarget(macroTargets.fat());
        profile.setMealsPerDay(Optional.ofNullable(profile.getMealsPerDay()).orElse(3));
    }

    private UserNutritionProfileDto toDto(UserNutritionProfile profile) {
        UserNutritionProfileDto dto = new UserNutritionProfileDto();
        dto.setUserId(profile.getUserId());
        dto.setAge(profile.getAge());
        dto.setGender(profile.getGender());
        dto.setHeightCm(profile.getHeightCm());
        dto.setWeightKg(profile.getWeightKg());
        dto.setActivityLevel(profile.getActivityLevel());
        dto.setGoal(profile.getGoal());
        dto.setBmr(profile.getBmr());
        dto.setTdee(profile.getTdee());
        dto.setTargetCalories(profile.getTargetCalories());
        dto.setProteinTarget(profile.getProteinTarget());
        dto.setCarbsTarget(profile.getCarbsTarget());
        dto.setFatTarget(profile.getFatTarget());
        dto.setMealsPerDay(profile.getMealsPerDay());
        dto.setPreferences(profile.getPreferences() == null ? Set.of() : new HashSet<>(profile.getPreferences()));
        dto.setAllergies(profile.getAllergies() == null ? Set.of() : new HashSet<>(profile.getAllergies()));
        return dto;
    }

    private Set<String> normalizeSet(Set<String> values) {
        Set<String> normalized = new HashSet<>();
        for (String value : values) {
            String cleaned = cleanText(value);
            if (!cleaned.isBlank()) {
                normalized.add(cleaned);
            }
        }
        return normalized;
    }

    private String cleanText(String text) {
        return Optional.ofNullable(text).orElse("").trim();
    }

    private int calculateBmr(String gender, Integer age, Integer heightCm, Integer weightKg) {
        String normalizedGender = Optional.ofNullable(gender).orElse("other").trim().toLowerCase(Locale.ROOT);
        if (normalizedGender.contains("female") || normalizedGender.contains("nu") || normalizedGender.contains("nữ")) {
            return (int) Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161);
        }
        if (normalizedGender.contains("male") || normalizedGender.contains("nam")) {
            return (int) Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5);
        }
        return (int) Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age));
    }

    private double resolveActivityFactor(String activityLevel) {
        String normalized = Optional.ofNullable(activityLevel).orElse("moderate").trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("sedentary") || normalized.contains("beginner") || normalized.contains("new") || normalized.contains("thap")) {
            return 1.2;
        }
        if (normalized.contains("light") || normalized.contains("1-2")) {
            return 1.375;
        }
        if (normalized.contains("very_active") || normalized.contains("very") || normalized.contains("athlete")) {
            return 1.9;
        }
        if (normalized.contains("active") || normalized.contains("intense") || normalized.contains("6-7") || normalized.contains("5")) {
            return 1.725;
        }
        return 1.55;
    }

    private String normalizeGoal(String goal) {
        String normalized = Optional.ofNullable(goal).orElse("maintain").trim().toLowerCase(Locale.ROOT);
        if (normalized.contains("giam") || normalized.contains("lose") || normalized.contains("fat") || normalized.contains("can")) {
            return "lose";
        }
        if (normalized.contains("tang") || normalized.contains("build") || normalized.contains("muscle") || normalized.contains("gain")) {
            return "build";
        }
        if (normalized.contains("ben") || normalized.contains("endurance")) {
            return "endurance";
        }
        return "maintain";
    }

    private int adjustCaloriesByGoal(int tdee, String goal) {
        switch (normalizeGoal(goal)) {
            case "lose":
                return Math.max(1200, tdee - 400);
            case "build":
                return tdee + 250;
            case "endurance":
                return tdee + 100;
            default:
                return tdee;
        }
    }

    private MacroTargets calculateMacroTargets(int calories, String goal) {
        switch (normalizeGoal(goal)) {
            case "lose":
                return new MacroTargets(
                        Math.max(0, Math.round((calories * 0.35f) / 4f)),
                        Math.max(0, Math.round((calories * 0.35f) / 4f)),
                        Math.max(0, Math.round((calories * 0.30f) / 9f))
                );
            case "build":
                return new MacroTargets(
                        Math.max(0, Math.round((calories * 0.30f) / 4f)),
                        Math.max(0, Math.round((calories * 0.45f) / 4f)),
                        Math.max(0, Math.round((calories * 0.25f) / 9f))
                );
            default:
                return new MacroTargets(
                        Math.max(0, Math.round((calories * 0.30f) / 4f)),
                        Math.max(0, Math.round((calories * 0.40f) / 4f)),
                        Math.max(0, Math.round((calories * 0.30f) / 9f))
                );
        }
    }

    private <T> void applyIfPresent(T value, java.util.function.Consumer<T> setter) {
        if (value != null) {
            setter.accept(value);
        }
    }

    private void applyIfHasText(String value, java.util.function.Consumer<String> setter) {
        String cleaned = cleanText(value);
        if (!cleaned.isBlank()) {
            setter.accept(cleaned);
        }
    }

    private record MacroTargets(int protein, int carbs, int fat) {}
}