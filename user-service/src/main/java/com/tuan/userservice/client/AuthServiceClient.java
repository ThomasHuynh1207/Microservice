package com.tuan.userservice.client;

import com.tuan.userservice.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auth-service", url = "http://localhost:8081")
public interface AuthServiceClient {

    @GetMapping("/api/auth/validate/{token}")
    UserDTO validateToken(@PathVariable String token);
}