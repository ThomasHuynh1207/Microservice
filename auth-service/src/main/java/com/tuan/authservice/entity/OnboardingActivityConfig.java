package com.tuan.authservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "onboarding_activity_config",
        uniqueConstraints = @UniqueConstraint(columnNames = "activity_level")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingActivityConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_level", nullable = false, length = 40)
    private String activityLevel;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(nullable = false, length = 300)
    private String description;

    @Column(name = "activity_factor", nullable = false)
    private Double activityFactor;
}
