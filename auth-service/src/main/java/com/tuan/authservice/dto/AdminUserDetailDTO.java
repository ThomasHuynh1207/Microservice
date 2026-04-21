package com.tuan.authservice.dto;

import lombok.Data;

@Data
public class AdminUserDetailDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private Boolean forcePasswordReset;
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private String fitnessGoal;
    private String onboardingGoal;
    private String activityLevel;
    private String specificGoal;
    private Integer tdee;
    private Integer weeklyGoal;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;
}