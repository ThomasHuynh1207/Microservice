package com.tuan.authservice.dto;

import lombok.Data;

@Data
public class AdminUserSummaryDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String status;
    private Boolean forcePasswordReset;
}