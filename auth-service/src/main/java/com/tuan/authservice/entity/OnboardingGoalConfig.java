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
        name = "onboarding_goal_config",
        uniqueConstraints = @UniqueConstraint(columnNames = "goal_type")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnboardingGoalConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "goal_type", nullable = false, length = 40)
    private String goalType;

    @Column(nullable = false, length = 80)
    private String label;

    @Column(name = "calorie_adjustment_type", nullable = false, length = 30)
    private String calorieAdjustmentType;

    @Column(name = "adjustment_value", nullable = false)
    private Double adjustmentValue;
}
