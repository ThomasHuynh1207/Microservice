package com.tuan.userservice.controller;

import com.tuan.userservice.dto.UserProfileDTO;
import com.tuan.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserProfile(id));
    }

    @PostMapping("/{id}")
    public ResponseEntity<UserProfileDTO> createUserProfile(@PathVariable Long id, @RequestBody UserProfileDTO profileDTO) {
        return ResponseEntity.ok(userService.createOrUpdateProfile(id, profileDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfileDTO> updateUserProfile(@PathVariable Long id, @RequestBody UserProfileDTO profileDTO) {
        return ResponseEntity.ok(userService.createOrUpdateProfile(id, profileDTO));
    }
}
