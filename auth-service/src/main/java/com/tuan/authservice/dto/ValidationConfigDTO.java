package com.tuan.authservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ValidationConfigDTO {

    @NotNull(message = "min_height_cm is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "min_height_cm must be > 0")
    private Double minHeightCm;

    @NotNull(message = "max_height_cm is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "max_height_cm must be > 0")
    private Double maxHeightCm;

    @NotNull(message = "min_weight_kg is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "min_weight_kg must be > 0")
    private Double minWeightKg;

    @NotNull(message = "max_weight_kg is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "max_weight_kg must be > 0")
    private Double maxWeightKg;

    @NotNull(message = "min_age is required")
    @Min(value = 1, message = "min_age must be >= 1")
    private Integer minAge;

    @NotNull(message = "max_age is required")
    @Min(value = 1, message = "max_age must be >= 1")
    private Integer maxAge;
}
