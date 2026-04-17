package com.tuan.nutritionservice.client;

import com.tuan.nutritionservice.dto.response.UserNutritionProfileDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "http://user-service:8082", configuration = com.tuan.nutritionservice.config.FeignConfig.class)
public interface UserServiceClient {

    @GetMapping("/api/v1/users/{userId}/nutrition-profile")
    UserNutritionProfileDto getNutritionProfile(@PathVariable("userId") Long userId);
}
