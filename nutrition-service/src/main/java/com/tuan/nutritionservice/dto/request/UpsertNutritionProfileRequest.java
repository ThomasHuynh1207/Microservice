package com.tuan.nutritionservice.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.Set;

@Data
public class UpsertNutritionProfileRequest {

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