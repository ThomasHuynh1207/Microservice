package com.tuan.workoutservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WorkoutSessionDTO {
    private Long id;
    private Long userId;
    private Long workoutPlanId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String notes;
    private Boolean completed;
}