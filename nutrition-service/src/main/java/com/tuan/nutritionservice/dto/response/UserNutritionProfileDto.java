package com.tuan.nutritionservice.dto.response;

import lombok.Data;

import java.util.Set;

@Data
public class UserNutritionProfileDto {
    private Long userId;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;
    private Set<String> preferences;
    private Set<String> allergies;
}
