package com.tuan.userservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private String bio;
    private String avatarUrl;
    private String fitnessLevel; // Beginner, Intermediate, Advanced
    private String preferredWorkoutType; // Cardio, Strength, Yoga, etc.
    private Integer weeklyGoal; // hours per week
}