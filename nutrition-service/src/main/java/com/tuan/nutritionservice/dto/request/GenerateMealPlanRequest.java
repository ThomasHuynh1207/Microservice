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

    @Min(1)
    private Integer heightCm;

    @Min(1)
    private Integer weightKg;

    private String activityLevel;
    private String goal;

    @Min(1)
    private Integer mealsPerDay;

    private Set<String> preferences;
    private Set<String> allergies;
}
