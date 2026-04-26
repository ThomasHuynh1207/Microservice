package com.tuan.authservice.client;

import com.tuan.authservice.dto.UserProfileSnapshotDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/api/users/email/{email}/profile")
    UserProfileSnapshotDTO getUserProfileByEmail(@PathVariable("email") String email);
}