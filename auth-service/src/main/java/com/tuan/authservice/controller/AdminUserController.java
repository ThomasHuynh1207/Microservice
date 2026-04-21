package com.tuan.authservice.controller;

import com.tuan.authservice.dto.AdminUserDetailDTO;
import com.tuan.authservice.dto.AdminUserSummaryDTO;
import com.tuan.authservice.dto.PasswordResetResponseDTO;
import com.tuan.authservice.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<AdminUserSummaryDTO>> listUsers(
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "status", required = false) String status
    ) {
        return ResponseEntity.ok(authService.getAdminUsers(search, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDetailDTO> getUserDetail(@PathVariable Long id) {
        return ResponseEntity.ok(authService.getAdminUserDetail(id));
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<AdminUserSummaryDTO> lockUser(@PathVariable Long id) {
        return ResponseEntity.ok(authService.lockUser(id));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<AdminUserSummaryDTO> unlockUser(@PathVariable Long id) {
        return ResponseEntity.ok(authService.unlockUser(id));
    }

    @PostMapping("/{id}/force-reset-password")
    public ResponseEntity<PasswordResetResponseDTO> forceResetPassword(@PathVariable Long id) {
        return ResponseEntity.ok(authService.forceResetPassword(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> hardDeleteUser(@PathVariable Long id) {
        authService.hardDeleteUser(id);
        return ResponseEntity.noContent().build();
    }
}