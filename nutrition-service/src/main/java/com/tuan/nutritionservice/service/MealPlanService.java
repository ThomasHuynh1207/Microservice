package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.dto.request.AddCustomMealItemRequest;
import com.tuan.nutritionservice.dto.request.GenerateMealPlanRequest;
import com.tuan.nutritionservice.dto.request.TrackMealRequest;
import com.tuan.nutritionservice.dto.request.UpdateMealItemRequest;
import com.tuan.nutritionservice.dto.response.MealPlanProgressResponse;
import com.tuan.nutritionservice.dto.response.MealPlanResponse;
import com.tuan.nutritionservice.dto.response.UserNutritionProfileDto;
import com.tuan.nutritionservice.entity.DailyMeal;
import com.tuan.nutritionservice.entity.MealItem;
import com.tuan.nutritionservice.entity.MealPlan;
import com.tuan.nutritionservice.entity.MealPlanStatus;
import com.tuan.nutritionservice.entity.MealType;
import com.tuan.nutritionservice.exception.NutritionException;
import com.tuan.nutritionservice.repository.MealPlanRepository;
import com.tuan.nutritionservice.client.UserServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MealPlanService {

    private final MealPlanRepository mealPlanRepository;
    private final MealPlanGenerator mealPlanGenerator;
    private final MealPlanTrackingService trackingService;
    private final UserServiceClient userServiceClient;

    @Transactional
    public MealPlanResponse generateMealPlan(GenerateMealPlanRequest request) {
        UserNutritionProfileDto profile = userServiceClient.getNutritionProfile(request.getUserId());
        MealPlan plan = mealPlanGenerator.generate(request, profile);
        return MealPlanResponseMapper.toResponse(mealPlanRepository.save(plan));
    }

    @Transactional(readOnly = true)
    public MealPlanResponse getMealPlan(Long planId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new NutritionException("Meal plan không tồn tại"));
        return MealPlanResponseMapper.toResponse(plan);
    }

    @Transactional(readOnly = true)
    public List<MealPlanResponse> getMealPlansByUser(Long userId) {
        return mealPlanRepository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(MealPlanResponseMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MealPlanResponse updateMealItem(Long planId, Long itemId, UpdateMealItemRequest request) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new NutritionException("Meal plan không tồn tại"));

        MealItem item = plan.getDailyMeals().stream()
                .flatMap(daily -> daily.getItems().stream())
                .filter(it -> it.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new NutritionException("Meal item không tồn tại trong plan"));

        if (request.getCustomName() != null) {
            item.setCustomName(request.getCustomName());
        }
        if (request.getCalories() != null) {
            item.setCalories(request.getCalories());
        }
        if (request.getQuantity() != null) {
            item.setQuantity(request.getQuantity());
        }

        return MealPlanResponseMapper.toResponse(mealPlanRepository.save(plan));
    }

    @Transactional
    public MealPlanResponse addCustomMealItem(Long planId, AddCustomMealItemRequest request) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new NutritionException("Meal plan không tồn tại"));

        DailyMeal dailyMeal = plan.getDailyMeals().stream()
                .filter(day -> day.getDayIndex().equals(request.getDayIndex()))
                .findFirst()
                .orElseThrow(() -> new NutritionException("Ngày trong plan không tồn tại"));

        MealItem newItem = MealItem.builder()
                .dailyMeal(dailyMeal)
                .customName(request.getCustomName())
                .quantity(request.getQuantity())
                .calories(request.getCalories())
                .protein(Optional.ofNullable(request.getProtein()).orElse(0))
                .carbs(Optional.ofNullable(request.getCarbs()).orElse(0))
                .fat(Optional.ofNullable(request.getFat()).orElse(0))
                .mealType(MealType.valueOf(request.getMealType().toUpperCase()))
                .eaten(false)
                .build();

        dailyMeal.getItems().add(newItem);
        return MealPlanResponseMapper.toResponse(mealPlanRepository.save(plan));
    }

    @Transactional
    public MealPlanResponse saveMealPlan(Long planId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new NutritionException("Meal plan không tồn tại"));
        plan.setStatus(MealPlanStatus.SAVED);
        return MealPlanResponseMapper.toResponse(mealPlanRepository.save(plan));
    }

    @Transactional
    public MealPlanProgressResponse trackMeal(Long planId, Integer dayIndex, Long itemId, TrackMealRequest request) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new NutritionException("Meal plan không tồn tại"));
        return trackingService.trackMeal(plan, dayIndex, itemId, request);
    }

    @Transactional(readOnly = true)
    public MealPlanProgressResponse getMealPlanProgress(Long planId) {
        MealPlan plan = mealPlanRepository.findById(planId)
                .orElseThrow(() -> new NutritionException("Meal plan không tồn tại"));
        return trackingService.calculateProgress(plan);
    }
}
