package com.tuan.nutritionservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "daily_nutrition_analysis",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "date"}))
public class DailyNutritionAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private LocalDate date;

    private int caloriesTarget;
    private int caloriesConsumed;
    private int caloriesBurned;
    private int proteinConsumed;
    private int carbConsumed;
    private int fatConsumed;
    private int recoveryScore;

    @Column(length = 1000)
    private String nutritionSummary;

    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public int getCaloriesTarget() { return caloriesTarget; }
    public void setCaloriesTarget(int caloriesTarget) { this.caloriesTarget = caloriesTarget; }
    public int getCaloriesConsumed() { return caloriesConsumed; }
    public void setCaloriesConsumed(int caloriesConsumed) { this.caloriesConsumed = caloriesConsumed; }
    public int getCaloriesBurned() { return caloriesBurned; }
    public void setCaloriesBurned(int caloriesBurned) { this.caloriesBurned = caloriesBurned; }
    public int getProteinConsumed() { return proteinConsumed; }
    public void setProteinConsumed(int proteinConsumed) { this.proteinConsumed = proteinConsumed; }
    public int getCarbConsumed() { return carbConsumed; }
    public void setCarbConsumed(int carbConsumed) { this.carbConsumed = carbConsumed; }
    public int getFatConsumed() { return fatConsumed; }
    public void setFatConsumed(int fatConsumed) { this.fatConsumed = fatConsumed; }
    public int getRecoveryScore() { return recoveryScore; }
    public void setRecoveryScore(int recoveryScore) { this.recoveryScore = recoveryScore; }
    public String getNutritionSummary() { return nutritionSummary; }
    public void setNutritionSummary(String nutritionSummary) { this.nutritionSummary = nutritionSummary; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
