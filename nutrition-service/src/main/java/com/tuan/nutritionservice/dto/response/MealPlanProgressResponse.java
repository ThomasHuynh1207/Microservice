package com.tuan.nutritionservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MealPlanProgressResponse {
    private Long planId;
    private Integer eatenMeals;
    private Integer totalMeals;
    private Double caloriesCompletion;
    private Double proteinCompletion;
    private Double carbsCompletion;
    private Double fatCompletion;
}
