package com.tuan.nutritionservice.service;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class ActivityClient {

    private static final String ACTIVITY_BASE = "http://activity-service:8083/api/activities";
    private final RestTemplate restTemplate;

    public ActivityClient() {
        this.restTemplate = new RestTemplate();
    }

    public int fetchTodayCaloriesBurned(Long userId) {
        try {
            TodaySummary summary = restTemplate.getForObject(
                    ACTIVITY_BASE + "/today/" + userId, TodaySummary.class);
            return summary != null ? summary.totalCaloriesBurned() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    public record TodaySummary(int totalCaloriesBurned, int activityCount) {}
}
