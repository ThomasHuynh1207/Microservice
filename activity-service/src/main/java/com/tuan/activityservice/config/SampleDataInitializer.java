package com.tuan.activityservice.config;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.ActivityRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedActivities(ActivityRepository activities) {
        return args -> {
            if (activities.count() > 0) {
                return;
            }
            activities.saveAll(List.of(
                    run(1L, "Demo Runner", "Canal tempo run", "Held the middle 4K right under target pace.", 7200, 42, 91, 460),
                    swim(1L, "Demo Runner", "Lunch freestyle ladder", "Easy 400 warmup, 8x100 steady, short cooldown.", 1800, 42, 138, 520),
                    run(2L, "Linh Tran", "Bridge repeats", "Six climbs with a relaxed jog home.", 9800, 58, 164, 690),
                    swim(3L, "Minh Pham", "Smooth 2K set", "Focused on long strokes and even breathing.", 2050, 48, 132, 560)
            ));
        };
    }

    private Activity run(Long userId, String athlete, String title, String notes, double meters, int minutes, int hr, int calories) {
        Activity activity = base(userId, athlete, SportType.RUN, title, notes, meters, minutes);
        activity.setAverageHeartRate(hr);
        activity.setCalories(calories);
        activity.setElevationGainMeters(52.0);
        activity.setRouteName("Saigon River Loop");
        return activity;
    }

    private Activity swim(Long userId, String athlete, String title, String notes, double meters, int minutes, int hr, int calories) {
        Activity activity = base(userId, athlete, SportType.SWIM, title, notes, meters, minutes);
        activity.setAverageHeartRate(hr);
        activity.setCalories(calories);
        activity.setPoolLengthMeters(50);
        activity.setStrokes(940);
        activity.setRouteName("District Pool");
        return activity;
    }

    private Activity base(Long userId, String athlete, SportType type, String title, String notes, double meters, int minutes) {
        Activity activity = new Activity();
        activity.setUserId(userId);
        activity.setAthleteName(athlete);
        activity.setSportType(type);
        activity.setTitle(title);
        activity.setDescription(notes);
        activity.setStartedAt(LocalDateTime.now().minusDays(userId).minusHours(minutes % 5));
        activity.setDistanceMeters(meters);
        activity.setDurationMinutes(minutes);
        activity.setVisibility("PUBLIC");
        return activity;
    }
}
