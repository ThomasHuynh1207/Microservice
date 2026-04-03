package com.tuan.progressservice.client;

import com.tuan.progressservice.dto.ProgressLogDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "http://localhost:8082")
public interface UserServiceClient {

    @GetMapping("/api/users/{id}")
    ProgressLogDTO getUser(@PathVariable Long id);
}