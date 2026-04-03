package com.tuan.userservice.dto;

import lombok.Data;

@Data
public class UserProfileDTO {
    private Long id;
    private Long userId;
    private String bio;
    private String avatarUrl;
    private String fitnessLevel;
    private String preferredWorkoutType;
    private Integer weeklyGoal;
}