package com.tuan.userservice.client;

import com.tuan.userservice.dto.SeedWorkoutRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "workout-service", url = "http://workout-service:8083")
public interface WorkoutServiceClient {

    @PostMapping("/api/workouts/generate-sample")
    Object generateSampleWorkoutPlan(@RequestBody SeedWorkoutRequest request);
}
