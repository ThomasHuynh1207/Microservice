package com.tuan.athleteservice.config;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.repository.AthleteProfileRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedAthletes(AthleteProfileRepository profiles) {
        return args -> {
            if (profiles.count() > 0) {
                return;
            }
            profiles.saveAll(List.of(
                    profile(1L, "Demo Runner", "Ho Chi Minh City", "Sub-60 10K and 3K swim week", 35, 3200),
                    profile(2L, "Linh Tran", "Da Nang", "Build a steady half-marathon base", 45, 1600),
                    profile(3L, "Minh Pham", "Ha Noi", "Swim smoother freestyle sets", 18, 5200)
            ));
        };
    }

    private AthleteProfile profile(Long userId, String name, String city, String goal, double runKm, int swimMeters) {
        AthleteProfile profile = new AthleteProfile();
        profile.setUserId(userId);
        profile.setDisplayName(name);
        profile.setCity(city);
        profile.setPrimaryGoal(goal);
        profile.setBio("Run and swim focused athlete.");
        profile.setExperienceLevel("INTERMEDIATE");
        profile.setPreferredTrainingDays("MON,WED,FRI,SUN");
        profile.setNutritionFocus("Endurance performance");
        profile.setWeeklyRunGoalKm(runKm);
        profile.setWeeklySwimGoalMeters(swimMeters);
        profile.setCompletedOnboarding(true);
        return profile;
    }
}
