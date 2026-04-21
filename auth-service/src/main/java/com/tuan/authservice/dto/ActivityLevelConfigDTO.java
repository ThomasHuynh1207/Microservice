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
public class ActivityLevelConfigDTO {

    @NotBlank(message = "activity_level is required")
    @Pattern(regexp = "^(sedentary|light|moderate|active|very_active)$", flags = Pattern.Flag.CASE_INSENSITIVE, message = "activity_level must be one of: sedentary, light, moderate, active, very_active")
    private String activityLevel;

    @NotBlank(message = "Activity label is required")
    @Size(max = 80, message = "Activity label max length is 80")
    private String label;

    @NotBlank(message = "Activity description is required")
    @Size(max = 300, message = "Activity description max length is 300")
    private String description;

    @NotNull(message = "Activity factor is required")
    @DecimalMin(value = "1.0", message = "Activity factor must be >= 1.0")
    @DecimalMax(value = "3.0", message = "Activity factor must be <= 3.0")
    private Double activityFactor;
}
