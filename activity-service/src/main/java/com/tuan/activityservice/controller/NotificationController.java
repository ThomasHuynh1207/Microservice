package com.tuan.activityservice.controller;

import com.tuan.activityservice.entity.Notification;
import com.tuan.activityservice.service.NotificationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities/notifications")
public class NotificationController {
    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping("/{userId}")
    List<Notification> list(@PathVariable Long userId) {
        return notifications.notifications(userId);
    }

    @PostMapping("/{userId}/read")
    void markAllRead(@PathVariable Long userId) {
        notifications.markAllRead(userId);
    }
}
