package com.tuan.nutritionservice.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "meal_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MealItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "daily_meal_id")
    private DailyMeal dailyMeal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "food_item_id")
    private FoodItem foodItem;

    private String customName;
    private Double quantity;
    private Integer calories;
    private Integer protein;
    private Integer carbs;
    private Integer fat;

    @Enumerated(EnumType.STRING)
    private MealType mealType;

    @Builder.Default
    private Boolean eaten = false;

    private Integer actualCalories;
    private Integer actualProtein;
    private Integer actualCarbs;
    private Integer actualFat;
}
