package com.tuan.authservice.service;

import com.tuan.authservice.dto.ActivityLevelConfigDTO;
import com.tuan.authservice.dto.DefaultConfigDTO;
import com.tuan.authservice.dto.GoalConfigDTO;
import com.tuan.authservice.dto.MacroConfigDTO;
import com.tuan.authservice.dto.OnboardingConfigDTO;
import com.tuan.authservice.dto.ValidationConfigDTO;
import com.tuan.authservice.entity.OnboardingActivityConfig;
import com.tuan.authservice.entity.OnboardingGoalConfig;
import com.tuan.authservice.entity.OnboardingSystemConfig;
import com.tuan.authservice.repository.OnboardingActivityConfigRepository;
import com.tuan.authservice.repository.OnboardingGoalConfigRepository;
import com.tuan.authservice.repository.OnboardingSystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OnboardingConfigService {

    private static final List<String> GOAL_ORDER = List.of("lose", "maintain", "gain");
    private static final List<String> ACTIVITY_ORDER = List.of("sedentary", "light", "moderate", "active", "very_active");
    private static final String ADJUSTMENT_TYPE_PERCENT = "percent";

    private final OnboardingGoalConfigRepository goalConfigRepository;
    private final OnboardingActivityConfigRepository activityConfigRepository;
    private final OnboardingSystemConfigRepository systemConfigRepository;

    @Transactional
    public void ensureDefaults() {
        if (goalConfigRepository.count() == 0) {
            goalConfigRepository.saveAll(List.of(
                    createGoal("lose", "Giảm cân", ADJUSTMENT_TYPE_PERCENT, 0.15d),
                    createGoal("maintain", "Duy trì", ADJUSTMENT_TYPE_PERCENT, 0.0d),
                    createGoal("gain", "Tăng cơ", ADJUSTMENT_TYPE_PERCENT, 0.10d)
            ));
        }

        if (activityConfigRepository.count() == 0) {
            activityConfigRepository.saveAll(List.of(
                    createActivity("sedentary", "Ít vận động", "Hầu hết thời gian ngồi, ít tập luyện", 1.2d),
                    createActivity("light", "Vận động nhẹ", "Tập 1-3 buổi/tuần", 1.375d),
                    createActivity("moderate", "Vận động vừa", "Tập 3-5 buổi/tuần", 1.55d),
                    createActivity("active", "Năng động", "Tập 6-7 buổi/tuần", 1.725d),
                    createActivity("very_active", "Rất năng động", "Cường độ cao hoặc lao động nặng", 1.9d)
            ));
        }

        if (systemConfigRepository.findTopByOrderByIdAsc().isEmpty()) {
            OnboardingSystemConfig defaults = new OnboardingSystemConfig();
            defaults.setProteinRatio(0.30d);
            defaults.setCarbsRatio(0.40d);
            defaults.setFatRatio(0.30d);
            defaults.setMinHeightCm(120.0d);
            defaults.setMaxHeightCm(230.0d);
            defaults.setMinWeightKg(35.0d);
            defaults.setMaxWeightKg(250.0d);
            defaults.setMinAge(13);
            defaults.setMaxAge(80);
            defaults.setDefaultGoal("maintain");
            defaults.setDefaultActivityLevel("moderate");
            defaults.setDefaultMealsPerDay(3);
            systemConfigRepository.save(defaults);
        }
    }

    @Transactional
    public OnboardingConfigDTO getConfig() {
        ensureDefaults();

        OnboardingSystemConfig systemConfig = systemConfigRepository.findTopByOrderByIdAsc()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Onboarding config not initialized"));

        List<GoalConfigDTO> goalConfigs = goalConfigRepository.findAll().stream()
                .sorted(Comparator.comparingInt(item -> orderIndex(GOAL_ORDER, normalizeToken(item.getGoalType()))))
                .map(this::toGoalDto)
                .toList();

        List<ActivityLevelConfigDTO> activityConfigs = activityConfigRepository.findAll().stream()
                .sorted(Comparator.comparingInt(item -> orderIndex(ACTIVITY_ORDER, normalizeToken(item.getActivityLevel()))))
                .map(this::toActivityDto)
                .toList();

        return new OnboardingConfigDTO(
                goalConfigs,
                activityConfigs,
                new MacroConfigDTO(
                        systemConfig.getProteinRatio(),
                        systemConfig.getCarbsRatio(),
                        systemConfig.getFatRatio()
                ),
                new ValidationConfigDTO(
                        systemConfig.getMinHeightCm(),
                        systemConfig.getMaxHeightCm(),
                        systemConfig.getMinWeightKg(),
                        systemConfig.getMaxWeightKg(),
                        systemConfig.getMinAge(),
                        systemConfig.getMaxAge()
                ),
                new DefaultConfigDTO(
                        systemConfig.getDefaultGoal(),
                        systemConfig.getDefaultActivityLevel(),
                        systemConfig.getDefaultMealsPerDay()
                )
        );
    }

    @Transactional
    public OnboardingConfigDTO updateConfig(OnboardingConfigDTO request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }

        Map<String, GoalConfigDTO> goalMap = normalizeGoals(request.getGoalConfigs());
        Map<String, ActivityLevelConfigDTO> activityMap = normalizeActivities(request.getActivityConfigs());

        validateRequestBusinessRules(request, goalMap, activityMap);

        goalConfigRepository.deleteAllInBatch();
        List<OnboardingGoalConfig> goalsToSave = GOAL_ORDER.stream()
                .map(key -> toGoalEntity(goalMap.get(key)))
                .toList();
        goalConfigRepository.saveAll(goalsToSave);

        activityConfigRepository.deleteAllInBatch();
        List<OnboardingActivityConfig> activitiesToSave = ACTIVITY_ORDER.stream()
                .map(key -> toActivityEntity(activityMap.get(key)))
                .toList();
        activityConfigRepository.saveAll(activitiesToSave);

        OnboardingSystemConfig systemConfig = systemConfigRepository.findTopByOrderByIdAsc()
                .orElse(new OnboardingSystemConfig());

        systemConfig.setProteinRatio(request.getMacroConfig().getProteinRatio());
        systemConfig.setCarbsRatio(request.getMacroConfig().getCarbsRatio());
        systemConfig.setFatRatio(request.getMacroConfig().getFatRatio());

        systemConfig.setMinHeightCm(request.getValidationConfig().getMinHeightCm());
        systemConfig.setMaxHeightCm(request.getValidationConfig().getMaxHeightCm());
        systemConfig.setMinWeightKg(request.getValidationConfig().getMinWeightKg());
        systemConfig.setMaxWeightKg(request.getValidationConfig().getMaxWeightKg());
        systemConfig.setMinAge(request.getValidationConfig().getMinAge());
        systemConfig.setMaxAge(request.getValidationConfig().getMaxAge());

        systemConfig.setDefaultGoal(normalizeToken(request.getDefaultConfig().getDefaultGoal()));
        systemConfig.setDefaultActivityLevel(normalizeToken(request.getDefaultConfig().getDefaultActivityLevel()));
        systemConfig.setDefaultMealsPerDay(request.getDefaultConfig().getDefaultMealsPerDay());

        systemConfigRepository.save(systemConfig);

        return getConfig();
    }

    private void validateRequestBusinessRules(
            OnboardingConfigDTO request,
            Map<String, GoalConfigDTO> goalMap,
            Map<String, ActivityLevelConfigDTO> activityMap
    ) {
        if (!goalMap.keySet().containsAll(GOAL_ORDER) || goalMap.size() != GOAL_ORDER.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "goalConfigs must include exactly: lose, maintain, gain");
        }

        if (!activityMap.keySet().containsAll(ACTIVITY_ORDER) || activityMap.size() != ACTIVITY_ORDER.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "activityConfigs must include exactly: sedentary, light, moderate, active, very_active");
        }

        for (GoalConfigDTO goal : request.getGoalConfigs()) {
            String adjustmentType = normalizeToken(goal.getCalorieAdjustmentType());
            if (!ADJUSTMENT_TYPE_PERCENT.equals(adjustmentType)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only percent calorie adjustment type is supported");
            }
        }

        double macroTotal = request.getMacroConfig().getProteinRatio()
                + request.getMacroConfig().getCarbsRatio()
                + request.getMacroConfig().getFatRatio();
        if (Math.abs(macroTotal - 1.0d) >= 0.001d) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Macro ratios must sum to 1.0");
        }

        ValidationConfigDTO validation = request.getValidationConfig();
        if (validation.getMinHeightCm() > validation.getMaxHeightCm()
                || validation.getMinWeightKg() > validation.getMaxWeightKg()
                || validation.getMinAge() > validation.getMaxAge()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Validation range is invalid");
        }

        String defaultGoal = normalizeToken(request.getDefaultConfig().getDefaultGoal());
        if (!goalMap.containsKey(defaultGoal)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "default_goal must exist in goalConfigs");
        }

        String defaultActivity = normalizeToken(request.getDefaultConfig().getDefaultActivityLevel());
        if (!activityMap.containsKey(defaultActivity)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "default_activity_level must exist in activityConfigs");
        }
    }

    private Map<String, GoalConfigDTO> normalizeGoals(List<GoalConfigDTO> input) {
        Map<String, GoalConfigDTO> normalized = new LinkedHashMap<>();
        if (input == null) {
            return normalized;
        }

        for (GoalConfigDTO item : input) {
            if (item == null) {
                continue;
            }
            String key = normalizeToken(item.getGoalType());
            if (key.isEmpty()) {
                continue;
            }
            if (normalized.containsKey(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicated goal_type: " + key);
            }
            item.setGoalType(key);
            item.setCalorieAdjustmentType(normalizeToken(item.getCalorieAdjustmentType()));
            item.setLabel(trimToEmpty(item.getLabel()));
            normalized.put(key, item);
        }

        return normalized;
    }

    private Map<String, ActivityLevelConfigDTO> normalizeActivities(List<ActivityLevelConfigDTO> input) {
        Map<String, ActivityLevelConfigDTO> normalized = new LinkedHashMap<>();
        if (input == null) {
            return normalized;
        }

        for (ActivityLevelConfigDTO item : input) {
            if (item == null) {
                continue;
            }
            String key = normalizeToken(item.getActivityLevel());
            if (key.isEmpty()) {
                continue;
            }
            if (normalized.containsKey(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Duplicated activity_level: " + key);
            }
            item.setActivityLevel(key);
            item.setLabel(trimToEmpty(item.getLabel()));
            item.setDescription(trimToEmpty(item.getDescription()));
            normalized.put(key, item);
        }

        return normalized;
    }

    private GoalConfigDTO toGoalDto(OnboardingGoalConfig entity) {
        return new GoalConfigDTO(
                entity.getGoalType(),
                entity.getLabel(),
                entity.getCalorieAdjustmentType(),
                entity.getAdjustmentValue()
        );
    }

    private ActivityLevelConfigDTO toActivityDto(OnboardingActivityConfig entity) {
        return new ActivityLevelConfigDTO(
                entity.getActivityLevel(),
                entity.getLabel(),
                entity.getDescription(),
                entity.getActivityFactor()
        );
    }

    private OnboardingGoalConfig toGoalEntity(GoalConfigDTO dto) {
        OnboardingGoalConfig entity = new OnboardingGoalConfig();
        entity.setGoalType(normalizeToken(dto.getGoalType()));
        entity.setLabel(trimToEmpty(dto.getLabel()));
        entity.setCalorieAdjustmentType(normalizeToken(dto.getCalorieAdjustmentType()));
        entity.setAdjustmentValue(dto.getValue());
        return entity;
    }

    private OnboardingActivityConfig toActivityEntity(ActivityLevelConfigDTO dto) {
        OnboardingActivityConfig entity = new OnboardingActivityConfig();
        entity.setActivityLevel(normalizeToken(dto.getActivityLevel()));
        entity.setLabel(trimToEmpty(dto.getLabel()));
        entity.setDescription(trimToEmpty(dto.getDescription()));
        entity.setActivityFactor(dto.getActivityFactor());
        return entity;
    }

    private OnboardingGoalConfig createGoal(String goalType, String label, String adjustmentType, double value) {
        OnboardingGoalConfig goal = new OnboardingGoalConfig();
        goal.setGoalType(goalType);
        goal.setLabel(label);
        goal.setCalorieAdjustmentType(adjustmentType);
        goal.setAdjustmentValue(value);
        return goal;
    }

    private OnboardingActivityConfig createActivity(String activityLevel, String label, String description, double activityFactor) {
        OnboardingActivityConfig activity = new OnboardingActivityConfig();
        activity.setActivityLevel(activityLevel);
        activity.setLabel(label);
        activity.setDescription(description);
        activity.setActivityFactor(activityFactor);
        return activity;
    }

    private int orderIndex(List<String> order, String key) {
        int index = order.indexOf(key);
        return index >= 0 ? index : Integer.MAX_VALUE;
    }

    private String normalizeToken(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
