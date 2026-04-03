package com.tuan.aiservice.dto;

import lombok.Data;

@Data
public class ChatRequestDTO {
    private Long userId;
    private String message;
}