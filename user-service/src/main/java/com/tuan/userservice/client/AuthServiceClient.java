package com.tuan.userservice.client;

import com.tuan.userservice.dto.OnboardingConfigPayload;
import com.tuan.userservice.dto.UserDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "auth-service", url = "http://auth-service:8081")
public interface AuthServiceClient {

    @GetMapping("/api/auth/validate/{token}")
    UserDTO validateToken(@PathVariable String token);

    @GetMapping("/api/auth/users")
    List<UserDTO> getAllUsers();

    @GetMapping("/api/auth/users/{id}")
    UserDTO getUserById(@PathVariable Long id);

    @GetMapping("/api/auth/onboarding-config")
    OnboardingConfigPayload getOnboardingConfig();
}