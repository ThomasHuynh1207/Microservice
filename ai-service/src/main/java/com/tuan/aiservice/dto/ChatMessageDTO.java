package com.tuan.aiservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatMessageDTO {
    private Long id;
    private Long userId;
    private String message;
    private String response;
    private LocalDateTime timestamp;
    private String messageType;
}