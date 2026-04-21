package com.tuan.authservice.dto;

import lombok.Data;

@Data
public class PasswordResetResponseDTO {
    private AdminUserDetailDTO user;
    private String temporaryPassword;
}