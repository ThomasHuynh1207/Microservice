package com.tuan.userservice.dto;

import lombok.Data;

import java.util.Set;

@Data
public class UserProfileDTO {
    private Long id;
    private Long userId;
    private String bio;
    private String avatarUrl;
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private String onboardingGoal;
    private String activityLevel;
    private String specificGoal;
    private Integer bmr;
    private Double activityFactor;
    private String tdeeFormula;
    private Integer tdee;
    private String fitnessLevel;
    private String preferredWorkoutType;
    private Integer weeklyGoal;

    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;
    private Set<String> preferences;
    private Set<String> allergies;
}