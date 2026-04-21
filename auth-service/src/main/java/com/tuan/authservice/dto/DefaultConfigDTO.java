package com.tuan.authservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DefaultConfigDTO {

    @NotBlank(message = "default_goal is required")
    @Pattern(regexp = "^(lose|maintain|gain)$", flags = Pattern.Flag.CASE_INSENSITIVE, message = "default_goal must be one of: lose, maintain, gain")
    private String defaultGoal;

    @NotBlank(message = "default_activity_level is required")
    @Pattern(regexp = "^(sedentary|light|moderate|active|very_active)$", flags = Pattern.Flag.CASE_INSENSITIVE, message = "default_activity_level must be one of: sedentary, light, moderate, active, very_active")
    private String defaultActivityLevel;

    @NotNull(message = "default_meals_per_day is required")
    @Min(value = 1, message = "default_meals_per_day must be >= 1")
    @Max(value = 10, message = "default_meals_per_day must be <= 10")
    private Integer defaultMealsPerDay;
}
