package com.tuan.nutritionservice.repository;

import com.tuan.nutritionservice.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    @Query("SELECT DISTINCT f FROM FoodItem f JOIN f.tags t " +
           "WHERE t = :tag AND NOT EXISTS (SELECT a FROM f.allergens a WHERE a IN :allergies)")
    List<FoodItem> findByTagAndNotAllergies(@Param("tag") String tag, @Param("allergies") Set<String> allergies);

    @Query("SELECT DISTINCT f FROM FoodItem f WHERE f.category IN :categories " +
           "AND NOT EXISTS (SELECT a FROM f.allergens a WHERE a IN :allergies)")
    List<FoodItem> findByCategoryInAndNotAllergies(@Param("categories") List<String> categories, @Param("allergies") Set<String> allergies);
}
