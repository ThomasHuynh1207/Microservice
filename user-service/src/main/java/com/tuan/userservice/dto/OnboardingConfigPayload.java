package com.tuan.userservice.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class OnboardingConfigPayload {
    private List<GoalConfigItem> goalConfigs = new ArrayList<>();
    private List<ActivityConfigItem> activityConfigs = new ArrayList<>();
    private MacroConfig macroConfig;
    private ValidationConfig validationConfig;
    private DefaultConfig defaultConfig;

    @Data
    public static class GoalConfigItem {
        private String goalType;
        private String label;
        private String calorieAdjustmentType;
        private Double value;
    }

    @Data
    public static class ActivityConfigItem {
        private String activityLevel;
        private String label;
        private String description;
        private Double activityFactor;
    }

    @Data
    public static class MacroConfig {
        private Double proteinRatio;
        private Double carbsRatio;
        private Double fatRatio;
    }

    @Data
    public static class ValidationConfig {
        private Double minHeightCm;
        private Double maxHeightCm;
        private Double minWeightKg;
        private Double maxWeightKg;
        private Integer minAge;
        private Integer maxAge;
    }

    @Data
    public static class DefaultConfig {
        private String defaultGoal;
        private String defaultActivityLevel;
        private Integer defaultMealsPerDay;
    }
}
