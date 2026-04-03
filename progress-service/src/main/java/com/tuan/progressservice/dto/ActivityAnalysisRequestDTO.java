package com.tuan.progressservice.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ActivityAnalysisRequestDTO {
    private Long userId;
    private String activityType;
    private LocalDate activityDate;
    private Double distanceKm;
    private Integer movingTimeMinutes;
    private Double averagePaceMinutesPerKm;
    private Double elevationGainMeters;
    private Integer averageHeartRate;
    private String notes;
}
