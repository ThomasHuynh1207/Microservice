package com.tuan.userservice.dto;

import lombok.Data;

import java.util.Set;

@Data
public class CompleteOnboardingRequest {
    private String gender;
    private Integer age;
    private Double heightCm;
    private Double weightKg;
    private String goal;
    private String activityLevel;
    private Integer trainingDaysPerWeek;
    private String specificGoal;
    private Set<String> preferences;
    private Set<String> allergies;
    private String dietPreference;
}
