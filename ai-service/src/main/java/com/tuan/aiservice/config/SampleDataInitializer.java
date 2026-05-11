package com.tuan.aiservice.config;

import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.repository.ChatMessageRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedChatMessages(ChatMessageRepository messages) {
        return args -> {
            if (messages.count() > 0) {
                return;
            }
            messages.saveAll(List.of(
                    message(1L, "user", "Can you build a 7-day plan for running and swimming?"),
                    message(1L, "assistant", "Start with two easy runs, two technique swims, and one rest day. Keep intensity low while building consistency."),
                    message(1L, "user", "What should I eat before tempo runs?"),
                    message(1L, "assistant", "Aim for easy carbs 2-3 hours before, and hydrate well. After, add protein and fluids for recovery.")
            ));
        };
    }

    private ChatMessage message(Long userId, String role, String content) {
        ChatMessage message = new ChatMessage();
        message.setUserId(userId);
        message.setRole(role);
        message.setContent(content);
        return message;
    }
}
