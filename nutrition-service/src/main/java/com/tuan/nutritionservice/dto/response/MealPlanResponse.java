package com.tuan.nutritionservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class MealPlanResponse {
    private Long id;
    private Long userId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer mealsPerDay;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private String status;
    private List<DailyMealResponse> dailyMeals;
}
