package com.tuan.nutritionservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "meal_plans")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer mealsPerDay;
    private Integer targetCalories;
    private Integer proteinTarget;
    private Integer carbsTarget;
    private Integer fatTarget;

    @Enumerated(EnumType.STRING)
    private MealPlanStatus status;

    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DailyMeal> dailyMeals = new ArrayList<>();
}
