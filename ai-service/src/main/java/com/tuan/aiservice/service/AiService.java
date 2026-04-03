package com.tuan.aiservice.service;

import com.tuan.aiservice.dto.ChatMessageDTO;
import com.tuan.aiservice.dto.ChatRequestDTO;
import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiService {

    private final ChatMessageRepository chatMessageRepository;
    private final WebClient webClient;

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

    private String callOpenAI(String message) {
        // Simplified OpenAI API call - in real implementation, you'd use proper OpenAI SDK
        String prompt = "You are a fitness coach AI. Help the user with their fitness goals. User message: " + message;

        // Mock response for now - replace with actual OpenAI API call
        return "As your fitness coach, I recommend starting with a balanced workout routine. " +
               "Based on your message about '" + message + "', let's focus on consistency and proper form.";
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