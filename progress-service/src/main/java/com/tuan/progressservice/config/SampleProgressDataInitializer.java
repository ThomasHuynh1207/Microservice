package com.tuan.progressservice.config;

import com.tuan.progressservice.entity.ProgressLog;
import com.tuan.progressservice.repository.ProgressLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "sample-data", havingValue = "true")
public class SampleProgressDataInitializer implements CommandLineRunner {

    private final ProgressLogRepository progressLogRepository;

    @Override
    public void run(String... args) {
        seedUserProgress(1L, 70.2);
        seedUserProgress(2L, 55.0);
    }

    private void seedUserProgress(Long userId, double baseWeight) {
        if (!progressLogRepository.findByUserId(userId).isEmpty()) {
            return;
        }

        List<ProgressLog> logs = List.of(
                buildLog(userId, LocalDate.now().minusDays(6), baseWeight, 42, "Run", 5.2, "Motivated"),
                buildLog(userId, LocalDate.now().minusDays(5), baseWeight - 0.1, 38, "Strength", 0.0, "Happy"),
                buildLog(userId, LocalDate.now().minusDays(4), baseWeight - 0.1, 30, "Cardio", 3.4, "Focused"),
                buildLog(userId, LocalDate.now().minusDays(3), baseWeight - 0.2, 45, "Run", 5.8, "Energetic"),
                buildLog(userId, LocalDate.now().minusDays(2), baseWeight - 0.2, 36, "Strength", 0.0, "Stable"),
                buildLog(userId, LocalDate.now().minusDays(1), baseWeight - 0.3, 40, "Cardio", 4.6, "Great"),
                buildLog(userId, LocalDate.now(), baseWeight - 0.3, 35, "Recovery", 2.0, "Calm")
        );

        progressLogRepository.saveAll(logs);
    }

    private ProgressLog buildLog(
            Long userId,
            LocalDate date,
            double weight,
            int workoutMinutes,
            String activityType,
            double distanceKm,
            String mood
    ) {
        ProgressLog log = new ProgressLog();
        log.setUserId(userId);
        log.setDate(date);
        log.setSource("manual");
        log.setActivityType(activityType);
        log.setDistanceKm(distanceKm);
        log.setWorkoutMinutes(workoutMinutes);
        log.setWeight(weight);
        log.setBodyFat(19.5);
        log.setAverageHeartRate(132);
        log.setMood(mood);
        log.setNotes("Du lieu mau tu dong cho dashboard");
        log.setAiInsight("Nhip do tap luyen on dinh, tiep tuc duy tri lich hien tai.");
        return log;
    }
}
