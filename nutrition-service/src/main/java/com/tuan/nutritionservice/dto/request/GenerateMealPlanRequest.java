package com.tuan.nutritionservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class GenerateMealPlanRequest {

    @NotNull
    private Long userId;

    @NotNull
    private LocalDate startDate;

    @NotNull
    @Min(1)
    private Integer mealsPerDay;

    @NotNull
    @Min(1)
    private Integer targetCalories;

    @NotNull
    @Min(1)
    private Integer proteinTarget;

    @NotNull
    @Min(1)
    private Integer carbsTarget;

    @NotNull
    @Min(1)
    private Integer fatTarget;

    private Set<String> preferences;
    private Set<String> allergies;
}
