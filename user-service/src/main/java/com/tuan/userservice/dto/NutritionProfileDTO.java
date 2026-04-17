package com.tuan.userservice.dto;

import lombok.Data;

import java.util.Set;

@Data
public class NutritionProfileDTO {
    private Long userId;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;
    private Set<String> preferences;
    private Set<String> allergies;
}
