package com.tuan.nutritionservice.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class UpdateMealItemRequest {
    @Min(1)
    private Integer calories;
    @Min(0)
    private Double quantity;
    private String customName;
}
