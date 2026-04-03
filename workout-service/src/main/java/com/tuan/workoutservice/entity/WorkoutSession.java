package com.tuan.workoutservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "workout_session")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long workoutPlanId;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;
    private Integer durationMinutes; // actual duration
    private String notes;
    private Boolean completed = false;
}