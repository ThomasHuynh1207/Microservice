package com.tuan.aiservice.service;

import com.tuan.aiservice.dto.ActivityAnalysisRequestDTO;
import com.tuan.aiservice.dto.ActivityAnalysisResponseDTO;
import com.tuan.aiservice.dto.ChatMessageDTO;
import com.tuan.aiservice.dto.ChatRequestDTO;
import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiService {

    private final ChatMessageRepository chatMessageRepository;

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openai.api.url}")
    private String openaiApiUrl;

    public ChatMessageDTO chat(ChatRequestDTO request) {
        // Call OpenAI API
        String aiResponse = callOpenAI(request.getMessage());

        // Save chat message
        ChatMessage message = new ChatMessage();
        message.setUserId(request.getUserId());
        message.setMessage(request.getMessage());
        message.setResponse(aiResponse);
        message.setTimestamp(LocalDateTime.now());
        message.setMessageType("user");

        ChatMessage savedMessage = chatMessageRepository.save(message);
        return convertToDTO(savedMessage);
    }

    public List<ChatMessageDTO> getChatHistory(Long userId) {
        return chatMessageRepository.findByUserIdOrderByTimestampDesc(userId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ActivityAnalysisResponseDTO analyzeActivity(ActivityAnalysisRequestDTO request) {
        ActivityAnalysisResponseDTO response = new ActivityAnalysisResponseDTO();
        response.setSummary(buildActivityInsight(request));
        return response;
    }

    private String callOpenAI(String message) {
        // Simplified OpenAI API call - in real implementation, you'd use proper OpenAI SDK
        // Mock response for now - replace with actual OpenAI API call
        return "As your fitness coach, I recommend starting with a balanced workout routine. " +
               "Based on your message about '" + message + "', let's focus on consistency and proper form.";
    }

    private String buildActivityInsight(ActivityAnalysisRequestDTO request) {
        List<String> parts = new ArrayList<>();

        String activityType = request.getActivityType() != null ? request.getActivityType() : "workout";
        parts.add("Activity summary: your " + activityType + " has been imported successfully.");

        if (request.getDistanceKm() != null && request.getMovingTimeMinutes() != null && request.getMovingTimeMinutes() > 0) {
            double speed = request.getDistanceKm() / (request.getMovingTimeMinutes() / 60.0);
            parts.add(String.format("You covered %.2f km in %d minutes, averaging %.2f km/h.", request.getDistanceKm(), request.getMovingTimeMinutes(), speed));
        }

        if (request.getAveragePaceMinutesPerKm() != null) {
            parts.add(String.format("Average pace was %.2f min/km, which is useful for tracking aerobic efficiency over time.", request.getAveragePaceMinutesPerKm()));
        }

        if (request.getAverageHeartRate() != null) {
            if (request.getAverageHeartRate() >= 160) {
                parts.add("Heart rate looks relatively high, so prioritize recovery, hydration, and an easier next session if fatigue is building.");
            } else if (request.getAverageHeartRate() >= 140) {
                parts.add("Heart rate suggests a solid moderate-to-hard effort that can support endurance gains when balanced with recovery.");
            } else {
                parts.add("Heart rate suggests an easier aerobic session, which is great for base building and recovery days.");
            }
        }

        if (request.getElevationGainMeters() != null && request.getElevationGainMeters() > 100) {
            parts.add(String.format("Elevation gain of %.0f meters adds meaningful load, so treat this as more demanding than a flat session of the same duration.", request.getElevationGainMeters()));
        }

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            parts.add("Athlete note: " + request.getNotes());
        }

        parts.add("Recommendation: keep one easy recovery session next, and compare pace versus heart-rate trend across the next 1 to 2 weeks for progress.");

        return String.join(" ", parts);
    }

    private ChatMessageDTO convertToDTO(ChatMessage message) {
        ChatMessageDTO dto = new ChatMessageDTO();
        dto.setId(message.getId());
        dto.setUserId(message.getUserId());
        dto.setMessage(message.getMessage());
        dto.setResponse(message.getResponse());
        dto.setTimestamp(message.getTimestamp());
        dto.setMessageType(message.getMessageType());
        return dto;
    }
}
