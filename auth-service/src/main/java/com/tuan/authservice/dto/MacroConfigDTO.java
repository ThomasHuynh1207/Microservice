package com.tuan.authservice.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MacroConfigDTO {

    @NotNull(message = "protein_ratio is required")
    @DecimalMin(value = "0.0", message = "protein_ratio must be >= 0")
    @DecimalMax(value = "1.0", message = "protein_ratio must be <= 1")
    private Double proteinRatio;

    @NotNull(message = "carbs_ratio is required")
    @DecimalMin(value = "0.0", message = "carbs_ratio must be >= 0")
    @DecimalMax(value = "1.0", message = "carbs_ratio must be <= 1")
    private Double carbsRatio;

    @NotNull(message = "fat_ratio is required")
    @DecimalMin(value = "0.0", message = "fat_ratio must be >= 0")
    @DecimalMax(value = "1.0", message = "fat_ratio must be <= 1")
    private Double fatRatio;
}
