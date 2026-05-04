package com.tuan.athleteservice.service;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.repository.AthleteProfileRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AthleteService {
    private final AthleteProfileRepository profiles;

    public AthleteService(AthleteProfileRepository profiles) {
        this.profiles = profiles;
    }

    @Transactional(readOnly = true)
    public AthleteProfile getProfile(Long userId) {
        return profiles.findByUserId(userId).orElseGet(() -> defaultProfile(userId));
    }

    @Transactional
    public AthleteProfile updateProfile(Long userId, AthleteProfileRequest request) {
        AthleteProfile profile = profiles.findByUserId(userId).orElseGet(() -> defaultProfile(userId));
        apply(profile, request, false);
        return profiles.save(profile);
    }

    @Transactional
    public AthleteProfile completeOnboarding(Long userId, AthleteProfileRequest request) {
        AthleteProfile profile = profiles.findByUserId(userId).orElseGet(() -> defaultProfile(userId));
        apply(profile, request, true);
        return profiles.save(profile);
    }

    @Transactional(readOnly = true)
    public List<AthleteSummary> leaderboard() {
        return List.of(
                new AthleteSummary(2L, "Linh Tran", "Da Nang", "RUN", 42.7, 1800, 512),
                new AthleteSummary(1L, "Demo Runner", "Ho Chi Minh City", "RUN + SWIM", 34.2, 3200, 438),
                new AthleteSummary(3L, "Minh Pham", "Ha Noi", "SWIM", 18.4, 5400, 391),
                new AthleteSummary(4L, "Hang Thu", "Nha Trang", "RUN", 28.9, 1200, 276)
        );
    }

    private void apply(AthleteProfile profile, AthleteProfileRequest request, boolean complete) {
        if (request.displayName() != null && !request.displayName().isBlank()) {
            profile.setDisplayName(request.displayName().trim());
        }
        profile.setCity(request.city());
        profile.setBio(request.bio());
        profile.setPrimaryGoal(request.primaryGoal());
        profile.setExperienceLevel(request.experienceLevel());
        profile.setPreferredTrainingDays(String.join(",", request.preferredTrainingDays() == null ? List.of() : request.preferredTrainingDays()));
        profile.setNutritionFocus(request.nutritionFocus());
        profile.setVisibility(request.visibility() == null ? "PUBLIC" : request.visibility());
        profile.setWeeklyRunGoalKm(request.weeklyRunGoalKm() == null ? profile.getWeeklyRunGoalKm() : request.weeklyRunGoalKm());
        profile.setWeeklySwimGoalMeters(request.weeklySwimGoalMeters() == null ? profile.getWeeklySwimGoalMeters() : request.weeklySwimGoalMeters());
        if (complete) {
            profile.setCompletedOnboarding(true);
        }
    }

    private AthleteProfile defaultProfile(Long userId) {
        AthleteProfile profile = new AthleteProfile();
        profile.setUserId(userId);
        profile.setDisplayName("Athlete #" + userId);
        profile.setCity("Ho Chi Minh City");
        profile.setBio("Training for better run and swim days.");
        profile.setPrimaryGoal("Build consistency");
        profile.setExperienceLevel("BEGINNER");
        profile.setPreferredTrainingDays("MON,WED,SAT");
        profile.setNutritionFocus("Balanced endurance fuel");
        return profile;
    }

    public record AthleteProfileRequest(
            String displayName,
            String city,
            String bio,
            String primaryGoal,
            String experienceLevel,
            List<String> preferredTrainingDays,
            String nutritionFocus,
            String visibility,
            Double weeklyRunGoalKm,
            Integer weeklySwimGoalMeters
    ) {
    }

    public record AthleteSummary(
            Long userId,
            String displayName,
            String city,
            String favoriteSport,
            double weeklyRunKm,
            int weeklySwimMeters,
            int kudos
    ) {
    }
}
