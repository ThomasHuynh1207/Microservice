package com.tuan.nutritionservice.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "user_nutrition_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNutritionProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    private Integer age;
    private String gender;

    private Integer heightCm;
    private Integer weightKg;
    private String activityLevel;
    private String goal;
    private Integer bmr;
    private Integer tdee;

    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;
    private Integer mealsPerDay;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "nutrition_profile_preferences", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "preference")
    @Builder.Default
    private Set<String> preferences = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "nutrition_profile_allergies", joinColumns = @JoinColumn(name = "profile_id"))
    @Column(name = "allergy")
    @Builder.Default
    private Set<String> allergies = new HashSet<>();

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void touchUpdatedAt() {
        this.updatedAt = Instant.now();
    }
}