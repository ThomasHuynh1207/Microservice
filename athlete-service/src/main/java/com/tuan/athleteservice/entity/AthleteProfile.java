package com.tuan.athleteservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "athlete_profiles")
public class AthleteProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private String displayName;

    private String city;
    private String bio;
    private String primaryGoal;
    private String experienceLevel;
    private String preferredTrainingDays;
    private String nutritionFocus;
    private String visibility = "PUBLIC";
    private String avatarUrl;
    private boolean completedOnboarding;
    private double weeklyRunGoalKm = 25;
    private int weeklySwimGoalMeters = 3000;
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getPrimaryGoal() {
        return primaryGoal;
    }

    public void setPrimaryGoal(String primaryGoal) {
        this.primaryGoal = primaryGoal;
    }

    public String getExperienceLevel() {
        return experienceLevel;
    }

    public void setExperienceLevel(String experienceLevel) {
        this.experienceLevel = experienceLevel;
    }

    public String getPreferredTrainingDays() {
        return preferredTrainingDays;
    }

    public void setPreferredTrainingDays(String preferredTrainingDays) {
        this.preferredTrainingDays = preferredTrainingDays;
    }

    public String getNutritionFocus() {
        return nutritionFocus;
    }

    public void setNutritionFocus(String nutritionFocus) {
        this.nutritionFocus = nutritionFocus;
    }

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public boolean isCompletedOnboarding() {
        return completedOnboarding;
    }

    public void setCompletedOnboarding(boolean completedOnboarding) {
        this.completedOnboarding = completedOnboarding;
    }

    public double getWeeklyRunGoalKm() {
        return weeklyRunGoalKm;
    }

    public void setWeeklyRunGoalKm(double weeklyRunGoalKm) {
        this.weeklyRunGoalKm = weeklyRunGoalKm;
    }

    public int getWeeklySwimGoalMeters() {
        return weeklySwimGoalMeters;
    }

    public void setWeeklySwimGoalMeters(int weeklySwimGoalMeters) {
        this.weeklySwimGoalMeters = weeklySwimGoalMeters;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
