package com.tuan.workoutservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WorkoutPlanDTO {
    private Long id;
    private Long userId;
    private String name;
    private String description;
    private String difficulty;
    private Integer durationWeeks;
    private String goal;
    private LocalDateTime createdAt;
}