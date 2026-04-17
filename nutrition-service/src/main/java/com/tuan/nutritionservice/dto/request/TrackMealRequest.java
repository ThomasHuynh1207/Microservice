package com.tuan.nutritionservice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TrackMealRequest {
    @NotNull
    private Boolean eaten;

    @Min(0)
    private Integer actualCalories;

    @Min(0)
    private Integer actualProtein;

    @Min(0)
    private Integer actualCarbs;

    @Min(0)
    private Integer actualFat;
}
