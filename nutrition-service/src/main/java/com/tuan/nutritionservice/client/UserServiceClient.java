package com.tuan.nutritionservice.client;

import com.tuan.nutritionservice.dto.response.UserSnapshotDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "http://user-service:8082", configuration = com.tuan.nutritionservice.config.FeignConfig.class)
public interface UserServiceClient {

    @GetMapping("/api/users/{userId}")
    UserSnapshotDto getUserById(@PathVariable("userId") Long userId);
}
