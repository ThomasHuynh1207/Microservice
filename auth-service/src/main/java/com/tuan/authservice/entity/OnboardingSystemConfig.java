package com.tuan.authservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "onboarding_system_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingSystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "protein_ratio", nullable = false)
    private Double proteinRatio;

    @Column(name = "carbs_ratio", nullable = false)
    private Double carbsRatio;

    @Column(name = "fat_ratio", nullable = false)
    private Double fatRatio;

    @Column(name = "min_height_cm", nullable = false)
    private Double minHeightCm;

    @Column(name = "max_height_cm", nullable = false)
    private Double maxHeightCm;

    @Column(name = "min_weight_kg", nullable = false)
    private Double minWeightKg;

    @Column(name = "max_weight_kg", nullable = false)
    private Double maxWeightKg;

    @Column(name = "min_age", nullable = false)
    private Integer minAge;

    @Column(name = "max_age", nullable = false)
    private Integer maxAge;

    @Column(name = "default_goal", nullable = false, length = 40)
    private String defaultGoal;

    @Column(name = "default_activity_level", nullable = false, length = 40)
    private String defaultActivityLevel;

    @Column(name = "default_meals_per_day", nullable = false)
    private Integer defaultMealsPerDay;
}
