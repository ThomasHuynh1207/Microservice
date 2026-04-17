package com.tuan.nutritionservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "daily_meals")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dayDate;
    private Integer dayIndex;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meal_plan_id")
    private MealPlan mealPlan;

    @OneToMany(mappedBy = "dailyMeal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MealItem> items = new ArrayList<>();
}
