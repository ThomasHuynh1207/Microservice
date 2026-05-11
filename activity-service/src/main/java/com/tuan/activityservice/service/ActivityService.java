package com.tuan.activityservice.service;

import com.tuan.activityservice.entity.Activity;
import com.tuan.activityservice.entity.ChallengeDefinition;
import com.tuan.activityservice.entity.ChallengeParticipant;
import com.tuan.activityservice.entity.Route;
import com.tuan.activityservice.entity.SavedRoute;
import com.tuan.activityservice.entity.SportType;
import com.tuan.activityservice.repository.ActivityRepository;
import com.tuan.activityservice.repository.ChallengeParticipantRepository;
import com.tuan.activityservice.repository.ChallengeRepository;
import com.tuan.activityservice.repository.RouteRepository;
import com.tuan.activityservice.repository.SavedRouteRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActivityService {
    private final ActivityRepository activities;
    private final RouteRepository routes;
    private final SavedRouteRepository savedRoutes;
    private final ChallengeRepository challenges;
    private final ChallengeParticipantRepository participants;
    private final NotificationService notifications;

    public ActivityService(
            ActivityRepository activities,
            RouteRepository routes,
            SavedRouteRepository savedRoutes,
            ChallengeRepository challenges,
            ChallengeParticipantRepository participants,
            NotificationService notifications) {
        this.activities = activities;
        this.routes = routes;
        this.savedRoutes = savedRoutes;
        this.challenges = challenges;
        this.participants = participants;
        this.notifications = notifications;
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
        Activity saved = activities.save(activity);
        notifications.create(
            request.userId(),
            "Activity logged",
            "Your " + saved.getSportType().name().toLowerCase(Locale.ROOT) + " activity is saved.",
            "ACTIVITY"
        );
        return saved;
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

    @Transactional(readOnly = true)
    public List<Route> routes() {
        return routes.findAll();
    }

    @Transactional(readOnly = true)
    public List<Long> savedRoutes(Long userId) {
        return savedRoutes.findByUserId(userId).stream()
                .map(saved -> saved.getRoute().getId())
                .toList();
    }

    @Transactional
    public void saveRoute(Long userId, Long routeId) {
        if (savedRoutes.existsByUserIdAndRoute_Id(userId, routeId)) {
            return;
        }
        Route route = routes.findById(routeId).orElseThrow(() -> new IllegalArgumentException("Route not found"));
        SavedRoute saved = new SavedRoute();
        saved.setUserId(userId);
        saved.setRoute(route);
        savedRoutes.save(saved);
    }

    @Transactional
    public void removeRoute(Long userId, Long routeId) {
        savedRoutes.deleteByUserIdAndRoute_Id(userId, routeId);
    }

    @Transactional(readOnly = true)
    public List<ChallengeView> challenges(Long userId) {
        List<Activity> week = activities.findByUserIdAndStartedAtAfter(userId, LocalDateTime.now().minusDays(7));
        double runMeters = metersFor(week, SportType.RUN);
        double swimMeters = metersFor(week, SportType.SWIM);
        long runSessions = week.stream().filter(activity -> activity.getSportType() == SportType.RUN).count();
        long swimSessions = week.stream().filter(activity -> activity.getSportType() == SportType.SWIM).count();
        Set<String> joined = participants.findByUserId(userId).stream()
                .map(participant -> participant.getChallenge().getCode())
                .collect(Collectors.toSet());

        return challenges.findAll().stream()
                .map(challenge -> toView(challenge, joined.contains(challenge.getCode()), runMeters, swimMeters, runSessions, swimSessions))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChallengeDefinition> challengeDefinitions() {
        return challenges.findAll();
    }

    @Transactional
    public ChallengeDefinition createChallenge(ChallengeRequest request) {
        if (request.code() == null || request.code().isBlank()) {
            throw new IllegalArgumentException("Challenge code is required");
        }
        if (challenges.findByCode(request.code()).isPresent()) {
            throw new IllegalArgumentException("Challenge code already exists");
        }
        ChallengeDefinition challenge = new ChallengeDefinition();
        challenge.setCode(request.code().trim());
        challenge.setTitle(defaultText(request.title(), request.code()));
        challenge.setSportType(defaultText(request.sportType(), "MIXED").toUpperCase(Locale.ROOT));
        challenge.setTargetValue(request.targetValue());
        challenge.setUnit(defaultText(request.unit(), "activities").toLowerCase(Locale.ROOT));
        challenge.setNote(defaultText(request.note(), ""));
        return challenges.save(challenge);
    }

    @Transactional
    public void joinChallenge(Long userId, String challengeId) {
        if (participants.existsByUserIdAndChallenge_Code(userId, challengeId)) {
            return;
        }
        ChallengeDefinition challenge = challenges.findByCode(challengeId)
                .orElseThrow(() -> new IllegalArgumentException("Challenge not found"));
        ChallengeParticipant participant = new ChallengeParticipant();
        participant.setUserId(userId);
        participant.setChallenge(challenge);
        participants.save(participant);
        notifications.create(userId, "Challenge joined", "You joined " + challenge.getTitle() + ".", "CHALLENGE");
    }

    @Transactional
    public void leaveChallenge(Long userId, String challengeId) {
        participants.deleteByUserIdAndChallenge_Code(userId, challengeId);
    }

    private ChallengeView toView(
            ChallengeDefinition challenge,
            boolean joined,
            double runMeters,
            double swimMeters,
            long runSessions,
            long swimSessions) {
        double progress;
        String sportType = normalize(challenge.getSportType());
        if ("RUN".equals(sportType)) {
            progress = percentage(runMeters, challenge.getTargetValue());
        } else if ("SWIM".equals(sportType)) {
            progress = percentage(swimMeters, challenge.getTargetValue());
        } else {
            int mixedProgress = Math.min((int) runSessions, 2) + Math.min((int) swimSessions, 2);
            progress = percentage(mixedProgress, challenge.getTargetValue());
        }
        return new ChallengeView(
                challenge.getCode(),
                challenge.getTitle(),
                challenge.getSportType(),
                targetLabel(challenge),
                Math.min(100, progress),
                challenge.getNote(),
                joined
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

    private double percentage(double current, double target) {
        if (target <= 0) {
            return 0;
        }
        return (current / target) * 100;
    }

    private String targetLabel(ChallengeDefinition challenge) {
        String unit = normalize(challenge.getUnit());
        int target = challenge.getTargetValue();
        if ("METERS".equals(unit)) {
            if ("RUN".equals(normalize(challenge.getSportType())) && target >= 1000) {
                double km = target / 1000.0;
                return km % 1 == 0 ? String.format(Locale.US, "%.0f km", km) : String.format(Locale.US, "%.1f km", km);
            }
            return target + " m";
        }
        if ("ACTIVITIES".equals(unit)) {
            return target + " sessions";
        }
        return target + " " + challenge.getUnit();
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
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

        public record ChallengeView(
            String id,
            String title,
            String sportType,
            String target,
            double progress,
            String note,
            boolean joined
        ) {
        }

        public record ChallengeRequest(String code, String title, String sportType, int targetValue, String unit, String note) {
        }
}
