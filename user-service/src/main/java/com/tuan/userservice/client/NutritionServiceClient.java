package com.tuan.userservice.client;

import com.tuan.userservice.dto.MealPlanGenerateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "nutrition-service", url = "http://nutrition-service:8086")
public interface NutritionServiceClient {

    @PostMapping("/api/v1/meal-plans/generate")
    Object generateMealPlan(@RequestBody MealPlanGenerateRequest request);
}
