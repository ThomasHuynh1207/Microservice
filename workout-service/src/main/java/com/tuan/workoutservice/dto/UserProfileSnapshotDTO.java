package com.tuan.workoutservice.dto;

import lombok.Data;

import java.util.Set;

@Data
public class UserProfileSnapshotDTO {
    private Long id;
    private Long userId;
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private String onboardingGoal;
    private String activityLevel;
    private String fitnessLevel;
    private Integer weeklyGoal;
    private Set<String> preferences;
}
