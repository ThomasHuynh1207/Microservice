package com.tuan.activityservice.service;

import com.tuan.activityservice.entity.Notification;
import com.tuan.activityservice.repository.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
    private final NotificationRepository notifications;

    public NotificationService(NotificationRepository notifications) {
        this.notifications = notifications;
    }

    @Transactional(readOnly = true)
    public List<Notification> notifications(Long userId) {
        return notifications.findTop30ByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Notification create(Long userId, String title, String message, String type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(defaultText(title, "Notification"));
        notification.setMessage(message == null ? "" : message.trim());
        notification.setType(defaultText(type, "GENERAL").toUpperCase());
        notification.setRead(false);
        return notifications.save(notification);
    }

    @Transactional
    public void markAllRead(Long userId) {
        List<Notification> unread = notifications.findByUserIdAndReadFalse(userId);
        if (unread.isEmpty()) {
            return;
        }
        unread.forEach(item -> item.setRead(true));
        notifications.saveAll(unread);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
