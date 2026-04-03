package com.tuan.aiservice.controller;

import com.tuan.aiservice.dto.ChatMessageDTO;
import com.tuan.aiservice.dto.ChatRequestDTO;
import com.tuan.aiservice.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<ChatMessageDTO> chat(@RequestBody ChatRequestDTO request) {
        ChatMessageDTO response = aiService.chat(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/chat/history/{userId}")
    public ResponseEntity<List<ChatMessageDTO>> getChatHistory(@PathVariable Long userId) {
        List<ChatMessageDTO> history = aiService.getChatHistory(userId);
        return ResponseEntity.ok(history);
    }
}