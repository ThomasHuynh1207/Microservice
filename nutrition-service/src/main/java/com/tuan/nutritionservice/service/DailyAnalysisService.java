package com.tuan.nutritionservice.service;

import com.tuan.nutritionservice.repository.NutritionPlanRepository;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class DailyAnalysisService {

    private final NutritionPlanRepository plans;
    private final NutritionService nutritionService;

    public DailyAnalysisService(NutritionPlanRepository plans, NutritionService nutritionService) {
        this.plans = plans;
        this.nutritionService = nutritionService;
    }

    @Scheduled(cron = "0 55 23 * * *")
    public void snapshotAllUsers() {
        List<Long> userIds = plans.findAll().stream()
                .map(p -> p.getUserId())
                .distinct()
                .toList();
        for (Long userId : userIds) {
            try {
                nutritionService.snapshotToday(userId);
            } catch (Exception ignored) {
            }
        }
    }
}
