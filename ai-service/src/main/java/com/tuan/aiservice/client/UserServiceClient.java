package com.tuan.aiservice.client;

import com.tuan.aiservice.dto.ChatMessageDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "http://localhost:8082")
public interface UserServiceClient {

    @GetMapping("/api/users/{id}")
    ChatMessageDTO getUser(@PathVariable Long id);
}