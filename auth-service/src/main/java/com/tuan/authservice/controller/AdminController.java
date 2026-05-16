package com.tuan.authservice.controller;

import com.tuan.authservice.service.AdminService;
import com.tuan.authservice.service.AdminService.DashboardStats;
import com.tuan.authservice.service.AdminService.UpdateUserRequest;
import com.tuan.authservice.service.AdminService.UserSummary;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummary>> getUsers(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats(
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminService.getStats());
    }

    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserSummary> updateUser(
            @PathVariable Long userId,
            @RequestBody UpdateUserRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String requesterRole) {
        if (!isAdmin(requesterRole)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(adminService.updateUser(userId, request));
    }

    private boolean isAdmin(String requesterRole) {
        return requesterRole != null && requesterRole.equalsIgnoreCase("ADMIN");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(ex.getMessage()));
    }

    record ErrorResponse(String message) {}
}
