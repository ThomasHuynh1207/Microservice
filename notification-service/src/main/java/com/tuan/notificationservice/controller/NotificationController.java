package com.tuan.notificationservice.controller;

import com.tuan.notificationservice.entity.Notification;
import com.tuan.notificationservice.service.NotificationService;
import com.tuan.notificationservice.service.NotificationService.CreateRequest;
import com.tuan.notificationservice.service.NotificationService.UnreadCountResponse;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    List<Notification> getAll(@RequestHeader("X-User-Id") Long userId) {
        return service.getAll(userId);
    }

    @GetMapping("/unread-count")
    UnreadCountResponse unreadCount(@RequestHeader("X-User-Id") Long userId) {
        return new UnreadCountResponse(service.unreadCount(userId));
    }

    @PutMapping("/{id}/read")
    Notification markRead(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return service.markRead(userId, id);
    }

    @PutMapping("/read-all")
    ResponseEntity<Map<String, Integer>> markAllRead(@RequestHeader("X-User-Id") Long userId) {
        int updated = service.markAllRead(userId);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @DeleteMapping("/{id}")
    ResponseEntity<Void> delete(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        service.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/internal")
    ResponseEntity<Notification> create(@RequestBody CreateRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }
}
