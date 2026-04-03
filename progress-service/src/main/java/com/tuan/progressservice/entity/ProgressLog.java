package com.tuan.progressservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "progress_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    private String source; // manual, strava, garmin, etc.
    private String externalActivityId;
    private String activityType; // Run, Ride, Swim, etc.
    private Double distanceKm;
    private Double averagePaceMinutesPerKm;
    private Double elevationGainMeters;
    private Integer averageHeartRate;
    private Double weight; // in kg
    private Double bodyFat; // percentage
    private Integer workoutMinutes; // minutes exercised
    private String notes;
    private String mood; // Happy, Tired, Motivated, etc.

    @Column(length = 2000)
    private String aiInsight;
}
