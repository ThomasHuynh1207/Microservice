package com.tuan.nutritionservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "food_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FoodItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String category;
    private Integer caloriesPer100g;
    private Integer proteinPer100g;
    private Integer carbsPer100g;
    private Integer fatPer100g;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "food_item_allergens", joinColumns = @JoinColumn(name = "food_item_id"))
    @Column(name = "allergen")
    @Builder.Default
    private Set<String> allergens = new HashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "food_item_tags", joinColumns = @JoinColumn(name = "food_item_id"))
    @Column(name = "tag")
    @Builder.Default
    private Set<String> tags = new HashSet<>();
}
