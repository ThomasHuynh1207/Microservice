package com.tuan.nutritionservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddCustomMealItemRequest {

    @NotNull
    private Integer dayIndex;

    @NotNull
    private String mealType;

    @NotBlank
    private String customName;

    @NotNull
    @Min(1)
    private Integer calories;

    @NotNull
    @Min(0)
    private Double quantity;

    private Integer protein;
    private Integer carbs;
    private Integer fat;
}
