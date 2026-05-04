package com.tuan.activityservice.service;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.ActivityRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {
    private final ActivityRepository activities;

    public ActivityService(ActivityRepository activities) {
        this.activities = activities;
    }

    @Transactional(readOnly = true)
    public List<Activity> userActivities(Long userId) {
        return activities.findByUserIdOrderByStartedAtDesc(userId);
    }

    @Transactional
    public Activity create(ActivityRequest request) {
        Activity activity = new Activity();
        activity.setUserId(request.userId());
        activity.setAthleteName(defaultText(request.athleteName(), "Athlete #" + request.userId()));
        activity.setSportType(request.sportType());
        activity.setTitle(defaultText(request.title(), request.sportType() == SportType.RUN ? "Morning run" : "Pool swim"));
        activity.setDescription(request.description());
        activity.setStartedAt(request.startedAt() == null ? LocalDateTime.now() : request.startedAt());
        activity.setDurationMinutes(request.durationMinutes());
        activity.setDistanceMeters(request.distanceMeters());
        activity.setAverageHeartRate(request.averageHeartRate());
        activity.setCalories(request.calories());
        activity.setElevationGainMeters(request.elevationGainMeters());
        activity.setPoolLengthMeters(request.poolLengthMeters());
        activity.setStrokes(request.strokes());
        activity.setRouteName(request.routeName());
        activity.setVisibility(defaultText(request.visibility(), "PUBLIC"));
        return activities.save(activity);
    }

    @Transactional(readOnly = true)
    public ActivityStats stats(Long userId) {
        List<Activity> week = activities.findByUserIdAndStartedAtAfter(userId, LocalDateTime.now().minusDays(7));
        List<Activity> month = activities.findByUserIdAndStartedAtAfter(userId, LocalDateTime.now().minusDays(30));
        return new ActivityStats(
                metersFor(week, SportType.RUN) / 1000,
                (int) metersFor(week, SportType.SWIM),
                minutesFor(week),
                week.size(),
                metersFor(month, SportType.RUN) / 1000,
                (int) metersFor(month, SportType.SWIM)
        );
    }

    public List<Challenge> challenges() {
        return List.of(
                new Challenge("run-30k", "30K Run Week", "RUN", "Run 30 kilometers this week.", 30000, "meters"),
                new Challenge("swim-5k", "5K Swim Block", "SWIM", "Swim 5000 meters across any number of sessions.", 5000, "meters"),
                new Challenge("brick-consistency", "Run + Swim Rhythm", "MIXED", "Log at least two runs and two swims in seven days.", 4, "activities")
        );
    }

    private double metersFor(List<Activity> source, SportType sportType) {
        return source.stream()
                .filter(activity -> activity.getSportType() == sportType)
                .mapToDouble(Activity::getDistanceMeters)
                .sum();
    }

    private int minutesFor(List<Activity> source) {
        return source.stream().mapToInt(Activity::getDurationMinutes).sum();
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    public record ActivityRequest(
            Long userId,
            String athleteName,
            SportType sportType,
            String title,
            String description,
            LocalDateTime startedAt,
            int durationMinutes,
            double distanceMeters,
            Integer averageHeartRate,
            Integer calories,
            Double elevationGainMeters,
            Integer poolLengthMeters,
            Integer strokes,
            String routeName,
            String visibility
    ) {
    }

    public record ActivityStats(
            double weeklyRunKm,
            int weeklySwimMeters,
            int weeklyMinutes,
            int weeklySessions,
            double monthlyRunKm,
            int monthlySwimMeters
    ) {
    }

    public record Challenge(String id, String name, String sportType, String description, int target, String unit) {
    }
}
