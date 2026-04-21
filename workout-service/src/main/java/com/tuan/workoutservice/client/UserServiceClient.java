package com.tuan.workoutservice.client;

import com.tuan.workoutservice.dto.UserProfileSnapshotDTO;
import com.tuan.workoutservice.dto.UserSnapshotDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/users/{id}")
    UserSnapshotDTO getUser(@PathVariable("id") Long id);

    @GetMapping("/api/users/{id}/profile")
    UserProfileSnapshotDTO getUserProfile(@PathVariable("id") Long id);
}