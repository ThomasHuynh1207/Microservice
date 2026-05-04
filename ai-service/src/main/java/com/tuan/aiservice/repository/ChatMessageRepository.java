package com.tuan.aiservice.repository;

import com.tuan.aiservice.entity.ChatMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
}
