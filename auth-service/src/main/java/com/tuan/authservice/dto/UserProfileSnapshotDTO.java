package com.tuan.authservice.dto;

import lombok.Data;

import java.util.Set;

@Data
public class UserProfileSnapshotDTO {
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private String onboardingGoal;
    private String activityLevel;
    private String specificGoal;
    private Integer tdee;
    private String fitnessLevel;
    private Integer weeklyGoal;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;
    private Set<String> preferences;
    private Set<String> allergies;
}