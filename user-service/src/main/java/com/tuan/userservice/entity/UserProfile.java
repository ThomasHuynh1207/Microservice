package com.tuan.userservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

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
    private Integer age;
    private String gender;
    private Double height;
    private Double weight;
    private String onboardingGoal;
    private String activityLevel;
    private String specificGoal;
    private Integer bmr;
    private Double activityFactor;
    private String tdeeFormula;
    private Integer tdee;
    private String fitnessLevel; // Beginner, Intermediate, Advanced
    private String preferredWorkoutType; // Cardio, Strength, Yoga, etc.
    private Integer weeklyGoal; // hours per week

    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_profile_preferences", joinColumns = @JoinColumn(name = "user_profile_id"))
    @Column(name = "preference")
    private Set<String> preferences = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_profile_allergies", joinColumns = @JoinColumn(name = "user_profile_id"))
    @Column(name = "allergy")
    private Set<String> allergies = new HashSet<>();
}
