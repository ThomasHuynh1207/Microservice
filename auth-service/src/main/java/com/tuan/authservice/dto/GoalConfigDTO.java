package com.tuan.authservice.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoalConfigDTO {

    @NotBlank(message = "goal_type is required")
    @Pattern(regexp = "^(lose|maintain|gain)$", flags = Pattern.Flag.CASE_INSENSITIVE, message = "goal_type must be one of: lose, maintain, gain")
    private String goalType;

    @NotBlank(message = "Goal label is required")
    @Size(max = 80, message = "Goal label max length is 80")
    private String label;

    @NotBlank(message = "calorie_adjustment_type is required")
    @Pattern(regexp = "^percent$", flags = Pattern.Flag.CASE_INSENSITIVE, message = "calorie_adjustment_type must be percent")
    private String calorieAdjustmentType;

    @NotNull(message = "Goal adjustment value is required")
    @DecimalMin(value = "0.0", message = "Goal adjustment value must be >= 0")
    @DecimalMax(value = "1.0", message = "Goal adjustment value must be <= 1")
    private Double value;
}
