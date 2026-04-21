package com.tuan.authservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingConfigDTO {

    @NotEmpty(message = "goalConfigs must not be empty")
    @Valid
    private List<GoalConfigDTO> goalConfigs = new ArrayList<>();

    @NotEmpty(message = "activityConfigs must not be empty")
    @Valid
    private List<ActivityLevelConfigDTO> activityConfigs = new ArrayList<>();

    @NotNull(message = "macroConfig is required")
    @Valid
    private MacroConfigDTO macroConfig;

    @NotNull(message = "validationConfig is required")
    @Valid
    private ValidationConfigDTO validationConfig;

    @NotNull(message = "defaultConfig is required")
    @Valid
    private DefaultConfigDTO defaultConfig;

    @AssertTrue(message = "Macro ratios must sum to 1.0")
    public boolean isMacroRatioSumValid() {
        if (macroConfig == null
                || macroConfig.getProteinRatio() == null
                || macroConfig.getCarbsRatio() == null
                || macroConfig.getFatRatio() == null) {
            return true;
        }

        double total = macroConfig.getProteinRatio() + macroConfig.getCarbsRatio() + macroConfig.getFatRatio();
        return Math.abs(total - 1.0d) < 0.001d;
    }

    @AssertTrue(message = "Validation min/max values are invalid")
    public boolean isValidationRangeValid() {
        if (validationConfig == null
                || validationConfig.getMinHeightCm() == null
                || validationConfig.getMaxHeightCm() == null
                || validationConfig.getMinWeightKg() == null
                || validationConfig.getMaxWeightKg() == null
                || validationConfig.getMinAge() == null
                || validationConfig.getMaxAge() == null) {
            return true;
        }

        return validationConfig.getMinHeightCm() <= validationConfig.getMaxHeightCm()
                && validationConfig.getMinWeightKg() <= validationConfig.getMaxWeightKg()
                && validationConfig.getMinAge() <= validationConfig.getMaxAge();
    }
}
