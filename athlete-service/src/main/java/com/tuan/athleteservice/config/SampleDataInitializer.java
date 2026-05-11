package com.tuan.athleteservice.config;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.entity.Follow;
import com.tuan.athleteservice.repository.AthleteProfileRepository;
import com.tuan.athleteservice.repository.FollowRepository;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SampleDataInitializer {
    @Bean
    CommandLineRunner seedAthletes(AthleteProfileRepository profiles, FollowRepository follows) {
        return args -> {
            List<AthleteProfile> sampleProfiles = List.of(
                    profile(1L, "Demo Runner", "Ho Chi Minh City", "Sub-60 10K and 3K swim week", 35, 3200),
                    profile(2L, "Linh Tran", "Da Nang", "Build a steady half-marathon base", 45, 1600),
                    profile(3L, "Minh Pham", "Ha Noi", "Swim smoother freestyle sets", 18, 5200),
                    profile(4L, "Hang Thu", "Nha Trang", "Add one more swim technique day", 28, 1800),
                    profile(5L, "An Nguyen", "Can Tho", "Swim endurance and easy weekend runs", 22, 3600)
            );
            for (AthleteProfile sample : sampleProfiles) {
                profiles.findByUserId(sample.getUserId()).orElseGet(() -> profiles.save(sample));
            }

            if (follows.count() == 0) {
                follows.saveAll(List.of(
                        follow(1L, 2L),
                        follow(1L, 3L),
                        follow(2L, 1L),
                        follow(3L, 5L),
                        follow(5L, 1L)
                ));
            }
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

    private Follow follow(Long followerId, Long followingId) {
        Follow follow = new Follow();
        follow.setFollowerUserId(followerId);
        follow.setFollowingUserId(followingId);
        return follow;
    }
}
