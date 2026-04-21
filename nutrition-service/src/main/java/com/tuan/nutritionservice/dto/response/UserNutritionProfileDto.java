package com.tuan.nutritionservice.dto.response;

import lombok.Data;

import java.util.Set;

@Data
public class UserNutritionProfileDto {
    private Long userId;
    private Integer age;
    private String gender;
    private Integer heightCm;
    private Integer weightKg;
    private String activityLevel;
    private String goal;
    private Integer bmr;
    private Integer tdee;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;
    private Set<String> preferences;
    private Set<String> allergies;
}
