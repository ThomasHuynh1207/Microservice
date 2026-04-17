package com.tuan.nutritionservice.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MealItemResponse {
    private Long id;
    private String name;
    private String mealType;
    private Integer calories;
    private Integer protein;
    private Integer carbs;
    private Integer fat;
    private Double quantity;
    private Boolean eaten;
    private Integer actualCalories;
    private Integer actualProtein;
    private Integer actualCarbs;
    private Integer actualFat;
}
