package com.tuan.authservice.controller;

import com.tuan.authservice.dto.AdminUserSummaryDTO;
import com.tuan.authservice.dto.LoginRequest;
import com.tuan.authservice.dto.RegisterRequest;
import com.tuan.authservice.dto.UserDTO;
import com.tuan.authservice.entity.User;
import com.tuan.authservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserDTO> register(@RequestBody RegisterRequest request) {
        User registered = authService.register(request);
        return ResponseEntity.ok(authService.convertToDTO(registered));
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(token);
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getUserById(id));
    }

    @GetMapping("/validate/{token}")
    public ResponseEntity<AdminUserSummaryDTO> validateToken(@PathVariable String token) {
        return ResponseEntity.ok(authService.validateToken(token));
    }
}