package com.tuan.authservice.client;

import com.tuan.authservice.dto.UserProfileSnapshotDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "http://user-service:8082")
public interface UserServiceClient {

    @GetMapping("/api/users/{id}/profile")
    UserProfileSnapshotDTO getUserProfile(@PathVariable("id") Long id);
}