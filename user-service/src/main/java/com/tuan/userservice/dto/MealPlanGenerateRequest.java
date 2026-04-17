package com.tuan.userservice.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.Set;

@Data
public class MealPlanGenerateRequest {
    private Long userId;
    private LocalDate startDate;
    private Integer mealsPerDay;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Set<String> preferences;
    private Set<String> allergies;
}
