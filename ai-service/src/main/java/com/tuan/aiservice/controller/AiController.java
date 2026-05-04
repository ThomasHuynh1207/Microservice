package com.tuan.aiservice.controller;

import com.tuan.aiservice.entity.ChatMessage;
import com.tuan.aiservice.service.AiCoachService;
import com.tuan.aiservice.service.AiCoachService.ChatRequest;
import com.tuan.aiservice.service.AiCoachService.ChatResponse;
import com.tuan.aiservice.service.AiCoachService.InsightRequest;
import com.tuan.aiservice.service.AiCoachService.InsightResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AiCoachService aiCoachService;

    public AiController(AiCoachService aiCoachService) {
        this.aiCoachService = aiCoachService;
    }

    @PostMapping("/chat")
    ChatResponse chat(@RequestBody ChatRequest request) {
        return aiCoachService.chat(request);
    }

    @GetMapping("/chat/{userId}")
    List<ChatMessage> history(@PathVariable Long userId) {
        return aiCoachService.history(userId);
    }

    @PostMapping("/insights")
    InsightResponse insights(@RequestBody InsightRequest request) {
        return aiCoachService.insights(request);
    }
}
