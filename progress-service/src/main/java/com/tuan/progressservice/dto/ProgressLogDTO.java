package com.tuan.progressservice.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ProgressLogDTO {
    private Long id;
    private Long userId;
    private LocalDate date;
    private Double weight;
    private Double bodyFat;
    private Integer workoutMinutes;
    private String notes;
    private String mood;
}