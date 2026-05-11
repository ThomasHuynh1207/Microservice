package com.tuan.athleteservice.service;

import com.tuan.athleteservice.entity.AthleteProfile;
import com.tuan.athleteservice.entity.Follow;
import com.tuan.athleteservice.repository.AthleteProfileRepository;
import com.tuan.athleteservice.repository.FollowRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AthleteService {
    private final AthleteProfileRepository profiles;
    private final FollowRepository follows;

    public AthleteService(AthleteProfileRepository profiles, FollowRepository follows) {
        this.profiles = profiles;
        this.follows = follows;
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

    @Transactional(readOnly = true)
    public List<FollowSummary> following(Long userId) {
        List<Follow> relationships = follows.findByFollowerUserId(userId);
        List<Long> ids = relationships.stream().map(Follow::getFollowingUserId).toList();
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, AthleteProfile> profileMap = profiles.findByUserIdIn(ids).stream()
                .collect(Collectors.toMap(AthleteProfile::getUserId, profile -> profile));
        return ids.stream()
                .map(id -> profileMap.getOrDefault(id, defaultProfile(id)))
                .map(profile -> new FollowSummary(
                        profile.getUserId(),
                        profile.getDisplayName(),
                        profile.getCity(),
                        profile.getPrimaryGoal(),
                        profile.getExperienceLevel()
                ))
                .toList();
    }

    @Transactional
    public void follow(Long userId, Long targetId) {
        if (userId.equals(targetId)) {
            return;
        }
        if (follows.existsByFollowerUserIdAndFollowingUserId(userId, targetId)) {
            return;
        }
        Follow follow = new Follow();
        follow.setFollowerUserId(userId);
        follow.setFollowingUserId(targetId);
        follows.save(follow);
    }

    @Transactional
    public void unfollow(Long userId, Long targetId) {
        follows.deleteByFollowerUserIdAndFollowingUserId(userId, targetId);
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

        public record FollowSummary(
            Long userId,
            String displayName,
            String city,
            String primaryGoal,
            String experienceLevel
        ) {
        }
}
