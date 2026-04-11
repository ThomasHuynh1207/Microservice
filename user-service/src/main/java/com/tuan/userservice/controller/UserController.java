package com.tuan.userservice.controller;

import com.tuan.userservice.dto.UserDTO;
import com.tuan.userservice.dto.UserProfileDTO;
import com.tuan.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        UserDTO user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(@PathVariable Long id, @RequestBody UserDTO userDTO) {
        UserDTO updatedUser = userService.updateUser(id, userDTO);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable Long id) {
        UserProfileDTO profile = userService.getUserProfile(id);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/{id}/profile")
    public ResponseEntity<UserProfileDTO> updateUserProfile(@PathVariable Long id, @RequestBody UserProfileDTO profileDTO) {
        UserProfileDTO updatedProfile = userService.createOrUpdateProfile(id, profileDTO);
        return ResponseEntity.ok(updatedProfile);
    }
}