package com.tuan.notificationservice.service;

import com.tuan.notificationservice.entity.Notification;
import com.tuan.notificationservice.repository.NotificationRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository repo;

    public NotificationService(NotificationRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<Notification> getAll(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return repo.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public Notification markRead(Long userId, Long notificationId) {
        Notification n = repo.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not your notification");
        }
        n.setRead(true);
        return repo.save(n);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return repo.markAllReadByUserId(userId);
    }

    @Transactional
    public void delete(Long userId, Long notificationId) {
        Notification n = repo.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Not your notification");
        }
        repo.delete(n);
    }

    @Transactional
    public Notification create(CreateRequest request) {
        Notification n = new Notification();
        n.setUserId(request.userId());
        n.setType(request.type());
        n.setTitle(request.title());
        n.setMessage(request.message());
        n.setActionUrl(request.actionUrl());
        return repo.save(n);
    }

    public record CreateRequest(
            Long userId,
            String type,
            String title,
            String message,
            String actionUrl
    ) {}

    public record UnreadCountResponse(long count) {}
}
