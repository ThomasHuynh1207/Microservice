package com.tuan.nutritionservice.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class DailyMealResponse {
    private Integer dayIndex;
    private LocalDate dayDate;
    private List<MealItemResponse> items;
}
