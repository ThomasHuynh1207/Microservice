package com.tuan.workoutservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "workout_plan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    private String description;
    private String difficulty; // Beginner, Intermediate, Advanced
    private Integer durationWeeks;
    private String goal; // Weight Loss, Muscle Gain, Endurance, etc.

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}