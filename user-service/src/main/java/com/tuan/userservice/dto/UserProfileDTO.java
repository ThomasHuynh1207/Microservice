package com.tuan.userservice.dto;

import lombok.Data;

import java.util.Set;

@Data
public class UserProfileDTO {
    private Long id;
    private Long userId;
    private String bio;
    private String avatarUrl;
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