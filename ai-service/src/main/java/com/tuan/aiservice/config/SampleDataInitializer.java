package com.tuan.aiservice.config;

import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.repository.ChatMessageRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedChatMessages(ChatMessageRepository messages) {
        return args -> {
            Set<Long> seededUsers = messages.findAll().stream()
                    .map(ChatMessage::getUserId).collect(Collectors.toSet());

            List<ChatMessage> toSeed = new ArrayList<>();

            if (!seededUsers.contains(1L)) {
                toSeed.add(message(1L, "user",      "Can you build a 7-day plan for running and swimming?"));
                toSeed.add(message(1L, "assistant", "Start with two easy runs, two technique swims, and one rest day. Keep intensity low while building consistency."));
                toSeed.add(message(1L, "user",      "What should I eat before tempo runs?"));
                toSeed.add(message(1L, "assistant", "Aim for easy carbs 2-3 hours before, and hydrate well. After, add protein and fluids for recovery."));
            }
            if (!seededUsers.contains(2L)) {
                toSeed.add(message(2L, "user",      "How do I pace my first half marathon?"));
                toSeed.add(message(2L, "assistant", "Start 10-15 seconds per km slower than goal pace for the first 5K, then settle into target pace. Walk breaks early save you in the final 5K."));
            }
            if (!seededUsers.contains(3L)) {
                toSeed.add(message(3L, "user",      "Tips for improving freestyle technique?"));
                toSeed.add(message(3L, "assistant", "Focus on a high elbow catch and a steady 6-beat kick. Drill with a pull buoy twice a week to isolate upper body mechanics."));
            }
            if (!seededUsers.contains(6L)) {
                toSeed.add(message(6L, "user",      "I'm training for my first marathon. What weekly mileage should I target?"));
                toSeed.add(message(6L, "assistant", "Build to 50-60 km per week over 12 weeks, with one long run reaching 30-32 km. Keep 80% of runs easy and schedule one rest day."));
            }
            if (!seededUsers.contains(9L)) {
                toSeed.add(message(9L, "user",      "How do I fuel during a 50K trail race?"));
                toSeed.add(message(9L, "assistant", "Target 60-90g carbs per hour from gels or real food. Start eating at 30 minutes and drink to thirst. Salt tabs help on hot days."));
            }

            if (!toSeed.isEmpty()) messages.saveAll(toSeed);
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
